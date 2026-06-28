import { AccountType, JournalStatus, VoucherStatus, VoucherType } from '@prisma/client';
import { prisma } from '../../config/db';

// ========================
// CHART OF ACCOUNTS
// ========================

export async function getAccountTree() {
  const accounts = await prisma.account.findMany({
    orderBy: { code: 'asc' },
    include: { children: { orderBy: { code: 'asc' } } },
  });
  // Return flat list; frontend builds tree from parentId
  return accounts.map((a) => ({
    id: a.id,
    code: a.code,
    nameEn: a.nameEn,
    nameAr: a.nameAr,
    type: a.type,
    parentId: a.parentId,
    isActive: a.isActive,
    description: a.description,
    hasChildren: a.children.length > 0,
  }));
}

export async function getAccountById(id: string) {
  return prisma.account.findUnique({
    where: { id },
    include: { parent: true, children: { orderBy: { code: 'asc' } } },
  });
}

export async function createAccount(data: {
  code: string;
  nameEn: string;
  nameAr: string;
  type: AccountType;
  parentId?: string;
  description?: string;
}) {
  return prisma.account.create({ data });
}

export async function updateAccount(id: string, data: {
  nameEn?: string;
  nameAr?: string;
  description?: string;
  isActive?: boolean;
}) {
  return prisma.account.update({ where: { id }, data });
}

// ========================
// JOURNAL ENTRIES
// ========================

export async function getJournalEntries(filters?: { status?: JournalStatus; from?: string; to?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.from || filters?.to) {
    where.date = {};
    if (filters?.from) (where.date as Record<string, unknown>).gte = new Date(filters.from);
    if (filters?.to) (where.date as Record<string, unknown>).lte = new Date(filters.to);
  }

  return prisma.journalEntry.findMany({
    where,
    include: {
      lines: { include: { account: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  });
}

export async function getJournalEntryById(id: string) {
  return prisma.journalEntry.findUnique({
    where: { id },
    include: {
      lines: { include: { account: true } },
      createdBy: { select: { name: true } },
      voucher: true,
    },
  });
}

export async function createJournalEntry(data: {
  date: string;
  description: string;
  reference?: string;
  createdById: string;
  lines: { accountId: string; debit: number; credit: number; description?: string }[];
}) {
  // Validate double-entry: total debits must equal total credits
  const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error('Total debits must equal total credits');
  }
  if (data.lines.length < 2) {
    throw new Error('Journal entry must have at least 2 lines');
  }

  const count = await prisma.journalEntry.count();
  const yr = new Date().getFullYear();
  const entryNumber = `JE-${yr}-${String(count + 1).padStart(3, '0')}`;

  return prisma.journalEntry.create({
    data: {
      entryNumber,
      date: new Date(data.date),
      description: data.description,
      reference: data.reference,
      totalAmount: totalDebit,
      createdById: data.createdById,
      lines: { create: data.lines },
    },
    include: { lines: { include: { account: true } }, createdBy: { select: { name: true } } },
  });
}

export async function postJournalEntry(id: string) {
  return prisma.journalEntry.update({
    where: { id },
    data: { status: JournalStatus.POSTED },
  });
}

export async function voidJournalEntry(id: string) {
  return prisma.journalEntry.update({
    where: { id },
    data: { status: JournalStatus.VOID },
  });
}

// ========================
// VOUCHERS
// ========================

export async function getVouchers(filters?: { type?: VoucherType; status?: VoucherStatus }) {
  const where: Record<string, unknown> = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;

  return prisma.voucher.findMany({
    where,
    include: {
      createdBy: { select: { name: true } },
      journalEntry: { select: { id: true, entryNumber: true, status: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  });
}

export async function getVoucherById(id: string) {
  return prisma.voucher.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      journalEntry: { include: { lines: { include: { account: true } } } },
    },
  });
}

export async function createVoucher(data: {
  type: VoucherType;
  date: string;
  partyName: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  referenceNo?: string;
  debitAccountId: string;
  creditAccountId: string;
  createdById: string;
}) {
  const count = await prisma.voucher.count({ where: { type: data.type } });
  const yr = new Date().getFullYear();
  const prefix = data.type === 'RECEIPT' ? 'RV' : 'PV';
  const voucherNumber = `${prefix}-${yr}-${String(count + 1).padStart(3, '0')}`;

  // Create voucher and journal entry in a transaction
  return prisma.$transaction(async (tx) => {
    const jeCount = await tx.journalEntry.count();
    const entryNumber = `JE-${yr}-${String(jeCount + 1).padStart(3, '0')}`;

    const journalEntry = await tx.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(data.date),
        description: data.description,
        reference: voucherNumber,
        status: JournalStatus.DRAFT,
        totalAmount: data.amount,
        createdById: data.createdById,
        lines: {
          create: [
            { accountId: data.debitAccountId, debit: data.amount, credit: 0 },
            { accountId: data.creditAccountId, debit: 0, credit: data.amount },
          ],
        },
      },
    });

    const voucher = await tx.voucher.create({
      data: {
        voucherNumber,
        type: data.type,
        date: new Date(data.date),
        partyName: data.partyName,
        description: data.description,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNo: data.referenceNo,
        createdById: data.createdById,
        journalEntryId: journalEntry.id,
      },
      include: {
        createdBy: { select: { name: true } },
        journalEntry: { select: { id: true, entryNumber: true, status: true } },
      },
    });

    return voucher;
  });
}

export async function approveVoucher(id: string) {
  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) throw new Error('Voucher not found');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.voucher.update({
      where: { id },
      data: { status: VoucherStatus.APPROVED },
    });

    if (voucher.journalEntryId) {
      await tx.journalEntry.update({
        where: { id: voucher.journalEntryId },
        data: { status: JournalStatus.POSTED },
      });
    }

    return updated;
  });
}

export async function voidVoucher(id: string) {
  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) throw new Error('Voucher not found');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.voucher.update({
      where: { id },
      data: { status: VoucherStatus.VOID },
    });

    if (voucher.journalEntryId) {
      await tx.journalEntry.update({
        where: { id: voucher.journalEntryId },
        data: { status: JournalStatus.VOID },
      });
    }

    return updated;
  });
}

// ========================
// LEDGER
// ========================

export async function getLedger(accountId: string, from?: string, to?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('Account not found');

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      accountId,
      journalEntry: {
        status: JournalStatus.POSTED,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
    },
    include: {
      journalEntry: { select: { entryNumber: true, date: true, description: true, reference: true } },
    },
    orderBy: { journalEntry: { date: 'asc' } },
  });

  let runningBalance = 0;
  const entries = lines.map((line) => {
    const debit = Number(line.debit);
    const credit = Number(line.credit);
    // Assets & Expenses: debit increases, credit decreases
    // Liabilities, Equity, Revenue: credit increases, debit decreases
    if (['ASSET', 'EXPENSE'].includes(account.type)) {
      runningBalance += debit - credit;
    } else {
      runningBalance += credit - debit;
    }
    return {
      id: line.id,
      date: line.journalEntry.date,
      entryNumber: line.journalEntry.entryNumber,
      description: line.description ?? line.journalEntry.description,
      reference: line.journalEntry.reference,
      debit,
      credit,
      balance: Math.round(runningBalance * 1000) / 1000,
    };
  });

  return {
    account: {
      id: account.id,
      code: account.code,
      nameEn: account.nameEn,
      nameAr: account.nameAr,
      type: account.type,
    },
    entries,
    closingBalance: Math.round(runningBalance * 1000) / 1000,
  };
}

// ========================
// TRIAL BALANCE
// ========================

export async function getTrialBalance(asOfDate?: string) {
  const dateFilter = asOfDate ? { lte: new Date(asOfDate) } : undefined;

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  const result = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (const account of accounts) {
    const aggregation = await prisma.journalEntryLine.aggregate({
      where: {
        accountId: account.id,
        journalEntry: {
          status: JournalStatus.POSTED,
          ...(dateFilter ? { date: dateFilter } : {}),
        },
      },
      _sum: { debit: true, credit: true },
    });

    const debitSum = Number(aggregation._sum.debit ?? 0);
    const creditSum = Number(aggregation._sum.credit ?? 0);
    const net = debitSum - creditSum;

    if (debitSum === 0 && creditSum === 0) continue;

    let debitBalance = 0;
    let creditBalance = 0;

    if (['ASSET', 'EXPENSE'].includes(account.type)) {
      if (net >= 0) debitBalance = net;
      else creditBalance = -net;
    } else {
      if (net <= 0) creditBalance = -net;
      else debitBalance = net;
    }

    totalDebit += debitBalance;
    totalCredit += creditBalance;

    result.push({
      accountId: account.id,
      code: account.code,
      nameEn: account.nameEn,
      nameAr: account.nameAr,
      type: account.type,
      debit: Math.round(debitBalance * 1000) / 1000,
      credit: Math.round(creditBalance * 1000) / 1000,
    });
  }

  return {
    accounts: result,
    totalDebit: Math.round(totalDebit * 1000) / 1000,
    totalCredit: Math.round(totalCredit * 1000) / 1000,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
}

// ========================
// PROFIT & LOSS
// ========================

export async function getProfitAndLoss(from?: string, to?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const revenueAccounts = await prisma.account.findMany({
    where: { type: AccountType.REVENUE, isActive: true },
    orderBy: { code: 'asc' },
  });

  const expenseAccounts = await prisma.account.findMany({
    where: { type: AccountType.EXPENSE, isActive: true },
    orderBy: { code: 'asc' },
  });

  const getAccountBalance = async (accountId: string, type: AccountType) => {
    const agg = await prisma.journalEntryLine.aggregate({
      where: {
        accountId,
        journalEntry: {
          status: JournalStatus.POSTED,
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
      },
      _sum: { debit: true, credit: true },
    });

    const d = Number(agg._sum.debit ?? 0);
    const c = Number(agg._sum.credit ?? 0);

    if (type === AccountType.REVENUE) return Math.round((c - d) * 1000) / 1000;
    return Math.round((d - c) * 1000) / 1000;
  };

  const revenueItems = [];
  let totalRevenue = 0;
  for (const acc of revenueAccounts) {
    const balance = await getAccountBalance(acc.id, acc.type);
    if (balance === 0) continue;
    totalRevenue += balance;
    revenueItems.push({ code: acc.code, nameEn: acc.nameEn, nameAr: acc.nameAr, amount: balance });
  }

  const expenseItems = [];
  let totalExpenses = 0;
  for (const acc of expenseAccounts) {
    const balance = await getAccountBalance(acc.id, acc.type);
    if (balance === 0) continue;
    totalExpenses += balance;
    expenseItems.push({ code: acc.code, nameEn: acc.nameEn, nameAr: acc.nameAr, amount: balance });
  }

  return {
    period: { from: from ?? null, to: to ?? null },
    revenue: { items: revenueItems, total: Math.round(totalRevenue * 1000) / 1000 },
    expenses: { items: expenseItems, total: Math.round(totalExpenses * 1000) / 1000 },
    netProfit: Math.round((totalRevenue - totalExpenses) * 1000) / 1000,
  };
}

// ========================
// BALANCE SHEET
// ========================

export async function getBalanceSheet(asOfDate?: string) {
  const dateFilter = asOfDate ? { lte: new Date(asOfDate) } : undefined;

  const getTypeBalances = async (type: AccountType) => {
    const accounts = await prisma.account.findMany({
      where: { type, isActive: true },
      orderBy: { code: 'asc' },
    });

    const items = [];
    let total = 0;

    for (const acc of accounts) {
      const agg = await prisma.journalEntryLine.aggregate({
        where: {
          accountId: acc.id,
          journalEntry: {
            status: JournalStatus.POSTED,
            ...(dateFilter ? { date: dateFilter } : {}),
          },
        },
        _sum: { debit: true, credit: true },
      });

      const d = Number(agg._sum.debit ?? 0);
      const c = Number(agg._sum.credit ?? 0);
      let balance: number;

      if (type === AccountType.ASSET || type === AccountType.EXPENSE) {
        balance = d - c;
      } else {
        balance = c - d;
      }

      if (balance === 0) continue;
      balance = Math.round(balance * 1000) / 1000;
      total += balance;
      items.push({ code: acc.code, nameEn: acc.nameEn, nameAr: acc.nameAr, balance });
    }

    return { items, total: Math.round(total * 1000) / 1000 };
  };

  const assets = await getTypeBalances(AccountType.ASSET);
  const liabilities = await getTypeBalances(AccountType.LIABILITY);
  const equity = await getTypeBalances(AccountType.EQUITY);

  // Net income = Revenue - Expenses (adds to equity)
  const revenue = await getTypeBalances(AccountType.REVENUE);
  const expenses = await getTypeBalances(AccountType.EXPENSE);
  const netIncome = Math.round((revenue.total - expenses.total) * 1000) / 1000;

  return {
    asOfDate: asOfDate ?? new Date().toISOString().slice(0, 10),
    assets,
    liabilities,
    equity: {
      items: [...equity.items, { code: 'NET', nameEn: 'Net Income (Current Period)', nameAr: 'صافي الدخل (الفترة الحالية)', balance: netIncome }],
      total: Math.round((equity.total + netIncome) * 1000) / 1000,
    },
    totalLiabilitiesAndEquity: Math.round((liabilities.total + equity.total + netIncome) * 1000) / 1000,
  };
}

// ========================
// FINANCIAL SUMMARY (KPI)
// ========================

export async function getFinancialSummary() {
  const pl = await getProfitAndLoss();

  const receivables = await prisma.journalEntryLine.aggregate({
    where: {
      account: { code: { startsWith: '12' } },
      journalEntry: { status: JournalStatus.POSTED },
    },
    _sum: { debit: true, credit: true },
  });

  const payables = await prisma.journalEntryLine.aggregate({
    where: {
      account: { code: { startsWith: '21' } },
      journalEntry: { status: JournalStatus.POSTED },
    },
    _sum: { debit: true, credit: true },
  });

  return {
    totalRevenue: pl.revenue.total,
    totalExpenses: pl.expenses.total,
    netProfit: pl.netProfit,
    outstandingReceivables: Math.round((Number(receivables._sum.debit ?? 0) - Number(receivables._sum.credit ?? 0)) * 1000) / 1000,
    outstandingPayables: Math.round((Number(payables._sum.credit ?? 0) - Number(payables._sum.debit ?? 0)) * 1000) / 1000,
  };
}

// ========================
// BANK RECONCILIATION
// ========================

export async function getBankReconciliation() {
  const transactions = await prisma.bankTransaction.findMany({
    orderBy: { date: 'asc' },
  });

  const matched = transactions.filter((t) => t.status === 'MATCHED');
  const unmatched = transactions.filter((t) => t.status === 'UNMATCHED');

  const systemBalance = matched.reduce((s, t) => s + Number(t.credit) - Number(t.debit), 0);
  const bankBalance = transactions.length > 0 ? Number(transactions[transactions.length - 1].balance) : 0;

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      reference: t.reference,
      debit: Number(t.debit),
      credit: Number(t.credit),
      balance: Number(t.balance),
      status: t.status,
      matchedVoucherId: t.matchedVoucherId,
    })),
    summary: {
      bankBalance: Math.round(bankBalance * 1000) / 1000,
      systemBalance: Math.round(systemBalance * 1000) / 1000,
      difference: Math.round((bankBalance - systemBalance) * 1000) / 1000,
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
    },
  };
}

export async function matchBankTransaction(transactionId: string, voucherId: string) {
  return prisma.bankTransaction.update({
    where: { id: transactionId },
    data: { status: 'MATCHED', matchedVoucherId: voucherId },
  });
}

export async function excludeBankTransaction(transactionId: string) {
  return prisma.bankTransaction.update({
    where: { id: transactionId },
    data: { status: 'EXCLUDED' },
  });
}

// Keep legacy revenue/expense functions for backward compatibility
export async function getRevenueEntries() {
  const vouchers = await prisma.voucher.findMany({
    where: { type: 'RECEIPT', status: { not: 'VOID' } },
    orderBy: { date: 'desc' },
    take: 50,
  });

  return vouchers.map((v) => ({
    id: v.id,
    date: v.date,
    voucherNumber: v.voucherNumber,
    partyName: v.partyName,
    description: v.description,
    amount: Number(v.amount),
    paymentMethod: v.paymentMethod,
    status: v.status,
  }));
}

export async function getExpenseEntries() {
  const vouchers = await prisma.voucher.findMany({
    where: { type: 'PAYMENT', status: { not: 'VOID' } },
    orderBy: { date: 'desc' },
    take: 50,
  });

  return vouchers.map((v) => ({
    id: v.id,
    date: v.date,
    voucherNumber: v.voucherNumber,
    partyName: v.partyName,
    description: v.description,
    amount: Number(v.amount),
    paymentMethod: v.paymentMethod,
    status: v.status,
  }));
}

export async function getProjections() {
  const now = new Date();
  const pl = await getProfitAndLoss();
  const baseRevenue = pl.revenue.total > 0 ? pl.revenue.total : 1050;
  const baseExpenses = pl.expenses.total > 0 ? pl.expenses.total : 315;

  const totalUnits = await prisma.unit.count();
  const occupiedUnits = await prisma.unit.count({ where: { status: 'OCCUPIED' } });
  const baseOccupancy = totalUnits > 0 ? occupiedUnits / totalUnits : 0.6;

  const months = [];
  for (let i = 1; i <= 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const variance = (Math.random() - 0.5) * 0.08;
    const occupancy = Math.min(0.98, Math.max(0.5, baseOccupancy + variance));
    const revenue = baseRevenue * (occupancy / (baseOccupancy || 0.6));
    const expenses = baseExpenses * (0.9 + Math.random() * 0.2);

    months.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      occupancy: Math.round(occupancy * 100),
      revenue: Math.round(revenue * 1000) / 1000,
      expenses: Math.round(expenses * 1000) / 1000,
      profit: Math.round((revenue - expenses) * 1000) / 1000,
    });
  }

  return months;
}
