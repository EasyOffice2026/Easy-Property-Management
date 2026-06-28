import { ContractStatus, RentPeriod } from '@prisma/client';
import { prisma } from '../../config/db';

const MONTHLY_EQUIVALENT: Record<RentPeriod, number> = {
  DAILY: 30,
  WEEKLY: 4.345,
  MONTHLY: 1,
  YEARLY: 1 / 12,
};

function toMonthlyRent(rentAmount: number, rentPeriod: RentPeriod) {
  return rentAmount * MONTHLY_EQUIVALENT[rentPeriod];
}

export async function getFinancialSummary() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const activeContracts = await prisma.contract.findMany({
    where: {
      status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING] },
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    select: { rentAmount: true, rentPeriod: true },
  });

  const totalRevenue = activeContracts.reduce(
    (sum, c) => sum + toMonthlyRent(Number(c.rentAmount), c.rentPeriod),
    0
  );

  const pettyCashExpenses = await prisma.pettyCashTransaction.aggregate({
    where: {
      type: 'EXPENSE',
      status: 'APPROVED',
      occurredAt: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });

  const totalExpenses = Number(pettyCashExpenses._sum.amount ?? 0);
  const netProfit = totalRevenue - totalExpenses;

  const overdueContracts = await prisma.contract.findMany({
    where: {
      status: { in: [ContractStatus.EXPIRED] },
      endDate: { lt: now },
    },
    select: { rentAmount: true, rentPeriod: true },
  });

  const outstandingReceivables = overdueContracts.reduce(
    (sum, c) => sum + toMonthlyRent(Number(c.rentAmount), c.rentPeriod),
    0
  );

  const pendingPayables = await prisma.pettyCashTransaction.aggregate({
    where: { type: 'EXPENSE', status: 'PENDING' },
    _sum: { amount: true },
  });

  return {
    totalRevenue: Math.round(totalRevenue * 1000) / 1000,
    totalExpenses: Math.round(totalExpenses * 1000) / 1000,
    netProfit: Math.round(netProfit * 1000) / 1000,
    outstandingReceivables: Math.round(outstandingReceivables * 1000) / 1000,
    outstandingPayables: Math.round(Number(pendingPayables._sum.amount ?? 0) * 1000) / 1000,
  };
}

export async function getRevenueEntries() {
  const contracts = await prisma.contract.findMany({
    where: { status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING, ContractStatus.EXPIRED] } },
    include: { tenant: true, unit: { include: { building: true } } },
    orderBy: { startDate: 'desc' },
    take: 50,
  });

  return contracts.map((c) => ({
    id: c.id,
    date: c.startDate,
    contractNumber: c.contractNumber,
    tenantName:
      c.tenant.tenantType === 'COMPANY'
        ? c.tenant.companyName
        : `${c.tenant.firstName ?? ''} ${c.tenant.lastName ?? ''}`.trim(),
    unitNumber: c.unit.unitNumber,
    description: `${c.rentPeriod} Rent`,
    amount: Number(c.rentAmount),
    paymentMethod: c.status === ContractStatus.ACTIVE || c.status === ContractStatus.EXPIRING ? 'Bank Transfer' : null,
    status: c.status === ContractStatus.EXPIRED ? 'UNPAID' : 'PAID',
  }));
}

export async function getExpenseEntries() {
  const transactions = await prisma.pettyCashTransaction.findMany({
    where: { type: 'EXPENSE' },
    include: { building: true },
    orderBy: { occurredAt: 'desc' },
    take: 50,
  });

  return transactions.map((t) => ({
    id: t.id,
    date: t.occurredAt,
    category: t.category,
    description: t.description,
    vendor: t.requestedBy,
    amount: Number(t.amount),
    status: t.status,
    buildingName: t.building?.nameEn ?? null,
  }));
}

export async function getProfitAndLoss() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const activeContracts = await prisma.contract.findMany({
    where: {
      status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING] },
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    select: { rentAmount: true, rentPeriod: true },
  });

  const rentalIncome = activeContracts.reduce(
    (sum, c) => sum + toMonthlyRent(Number(c.rentAmount), c.rentPeriod),
    0
  );

  const expenses = await prisma.pettyCashTransaction.groupBy({
    by: ['category'],
    where: {
      type: 'EXPENSE',
      status: 'APPROVED',
      occurredAt: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });

  const expenseBreakdown = expenses.map((e) => ({
    category: e.category,
    amount: Math.round(Number(e._sum.amount ?? 0) * 1000) / 1000,
  }));

  const totalExpenses = expenseBreakdown.reduce((sum, e) => sum + e.amount, 0);

  return {
    month: monthStart.toISOString().slice(0, 7),
    revenue: {
      rentalIncome: Math.round(rentalIncome * 1000) / 1000,
      total: Math.round(rentalIncome * 1000) / 1000,
    },
    expenses: {
      breakdown: expenseBreakdown,
      total: Math.round(totalExpenses * 1000) / 1000,
    },
    netProfit: Math.round((rentalIncome - totalExpenses) * 1000) / 1000,
  };
}

export async function getBalanceSheet() {
  const summary = await getFinancialSummary();

  return {
    assets: {
      cashAndBank: 85400,
      accountsReceivable: summary.outstandingReceivables,
      securityDeposits: 12000,
      propertyAssets: 2400000,
      furnitureAndEquipment: 180000,
    },
    liabilities: {
      accountsPayable: summary.outstandingPayables,
      advanceRents: 18000,
      longTermLoans: 320000,
    },
    equity: {
      ownersEquity: 2313900,
      retainedEarnings: 31600,
    },
  };
}

export async function getCashFlow() {
  const summary = await getFinancialSummary();

  return {
    operating: {
      rentCollected: summary.totalRevenue,
      expensesPaid: summary.totalExpenses,
      net: summary.netProfit,
    },
    investing: {
      assetPurchases: 2200,
    },
    financing: {
      loanRepayment: 5000,
    },
    netCashIncrease: Math.round((summary.netProfit - 2200 - 5000) * 1000) / 1000,
  };
}

export async function getProjections() {
  const now = new Date();
  const activeContracts = await prisma.contract.findMany({
    where: { status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING] } },
    select: { rentAmount: true, rentPeriod: true },
  });

  const totalUnits = await prisma.unit.count();
  const occupiedUnits = await prisma.unit.count({ where: { status: 'OCCUPIED' } });
  const baseOccupancy = totalUnits > 0 ? occupiedUnits / totalUnits : 0.87;

  const baseRevenue = activeContracts.reduce(
    (sum, c) => sum + toMonthlyRent(Number(c.rentAmount), c.rentPeriod),
    0
  );

  const months = [];
  for (let i = 1; i <= 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const variance = (Math.random() - 0.5) * 0.08;
    const occupancy = Math.min(0.98, Math.max(0.75, baseOccupancy + variance));
    const revenue = baseRevenue * (occupancy / baseOccupancy);
    const expenses = revenue * 0.3;

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
