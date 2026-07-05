import { apiClient } from './client';

// ========================
// TYPES
// ========================

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface AccountNode {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  type: AccountType;
  parentId: string | null;
  isActive: boolean;
  description: string | null;
  hasChildren: boolean;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  account: { code: string; nameEn: string; nameAr: string; type: AccountType };
  debit: number;
  credit: number;
  description: string | null;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string | null;
  status: 'DRAFT' | 'POSTED' | 'VOID';
  totalAmount: number;
  createdBy: { name: string };
  lines: JournalEntryLine[];
  createdAt: string;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: 'RECEIPT' | 'PAYMENT';
  date: string;
  partyName: string;
  description: string;
  amount: number;
  paymentMethod: string | null;
  referenceNo: string | null;
  status: 'DRAFT' | 'APPROVED' | 'VOID';
  createdBy: { name: string };
  journalEntry: { id: string; entryNumber: string; status: string } | null;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  entryNumber: string;
  description: string;
  reference: string | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerData {
  account: { id: string; code: string; nameEn: string; nameAr: string; type: AccountType };
  entries: LedgerEntry[];
  closingBalance: number;
}

export interface TrialBalanceAccount {
  accountId: string;
  code: string;
  nameEn: string;
  nameAr: string;
  type: AccountType;
  debit: number;
  credit: number;
}

export interface TrialBalanceData {
  accounts: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface PLItem {
  code: string;
  nameEn: string;
  nameAr: string;
  amount: number;
}

export interface ProfitAndLoss {
  period: { from: string | null; to: string | null };
  revenue: { items: PLItem[]; total: number };
  expenses: { items: PLItem[]; total: number };
  netProfit: number;
}

export interface BSItem {
  code: string;
  nameEn: string;
  nameAr: string;
  balance: number;
}

export interface BalanceSheet {
  asOfDate: string;
  assets: { items: BSItem[]; total: number };
  liabilities: { items: BSItem[]; total: number };
  equity: { items: BSItem[]; total: number };
  totalLiabilitiesAndEquity: number;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  reference: string | null;
  debit: number;
  credit: number;
  balance: number;
  status: 'MATCHED' | 'UNMATCHED' | 'EXCLUDED';
  matchedVoucherId: string | null;
}

export interface ReconciliationData {
  transactions: BankTransaction[];
  summary: {
    bankBalance: number;
    systemBalance: number;
    difference: number;
    matchedCount: number;
    unmatchedCount: number;
  };
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingReceivables: number;
  outstandingPayables: number;
}

export interface Projection {
  month: string;
  occupancy: number;
  revenue: number;
  expenses: number;
  profit: number;
}

// ========================
// API CALLS
// ========================

type Res<T> = { success: boolean; data: T };

// Chart of Accounts
export async function getAccountTree(): Promise<AccountNode[]> {
  const { data } = await apiClient.get<Res<AccountNode[]>>('/accounting/accounts');
  return data.data;
}

export async function createAccount(body: {
  code: string; nameEn: string; nameAr: string; type: AccountType; parentId?: string; description?: string;
}): Promise<AccountNode> {
  const { data } = await apiClient.post<Res<AccountNode>>('/accounting/accounts', body);
  return data.data;
}

export async function updateAccount(id: string, body: {
  nameEn?: string; nameAr?: string; description?: string; isActive?: boolean;
}): Promise<AccountNode> {
  const { data } = await apiClient.put<Res<AccountNode>>(`/accounting/accounts/${id}`, body);
  return data.data;
}

// Journal Entries
export async function getJournalEntries(params?: { status?: string; from?: string; to?: string }): Promise<JournalEntry[]> {
  const { data } = await apiClient.get<Res<JournalEntry[]>>('/accounting/journals', { params });
  return data.data;
}

export async function createJournalEntry(body: {
  date: string; description: string; reference?: string;
  lines: { accountId: string; debit: number; credit: number; description?: string }[];
}): Promise<JournalEntry> {
  const { data } = await apiClient.post<Res<JournalEntry>>('/accounting/journals', body);
  return data.data;
}

export async function postJournalEntry(id: string): Promise<JournalEntry> {
  const { data } = await apiClient.patch<Res<JournalEntry>>(`/accounting/journals/${id}/post`);
  return data.data;
}

export async function voidJournalEntry(id: string): Promise<JournalEntry> {
  const { data } = await apiClient.patch<Res<JournalEntry>>(`/accounting/journals/${id}/void`);
  return data.data;
}

// Vouchers
export async function getVouchers(params?: { type?: string; status?: string }): Promise<Voucher[]> {
  const { data } = await apiClient.get<Res<Voucher[]>>('/accounting/vouchers', { params });
  return data.data;
}

export async function createVoucher(body: {
  type: 'RECEIPT' | 'PAYMENT'; date: string; partyName: string; description: string;
  amount: number; paymentMethod?: string; referenceNo?: string;
  debitAccountId: string; creditAccountId: string;
}): Promise<Voucher> {
  const { data } = await apiClient.post<Res<Voucher>>('/accounting/vouchers', body);
  return data.data;
}

export async function approveVoucher(id: string): Promise<Voucher> {
  const { data } = await apiClient.patch<Res<Voucher>>(`/accounting/vouchers/${id}/approve`);
  return data.data;
}

export async function voidVoucher(id: string): Promise<Voucher> {
  const { data } = await apiClient.patch<Res<Voucher>>(`/accounting/vouchers/${id}/void`);
  return data.data;
}

// Ledger
export async function getLedger(accountId: string, params?: { from?: string; to?: string }): Promise<LedgerData> {
  const { data } = await apiClient.get<Res<LedgerData>>(`/accounting/ledger/${accountId}`, { params });
  return data.data;
}

// Reports
export async function getFinancialSummary(): Promise<FinancialSummary> {
  const { data } = await apiClient.get<Res<FinancialSummary>>('/accounting/summary');
  return data.data;
}

export async function getTrialBalance(params?: { asOfDate?: string }): Promise<TrialBalanceData> {
  const { data } = await apiClient.get<Res<TrialBalanceData>>('/accounting/trial-balance', { params });
  return data.data;
}

export async function getProfitAndLoss(params?: { from?: string; to?: string }): Promise<ProfitAndLoss> {
  const { data } = await apiClient.get<Res<ProfitAndLoss>>('/accounting/profit-loss', { params });
  return data.data;
}

export async function getBalanceSheet(params?: { asOfDate?: string }): Promise<BalanceSheet> {
  const { data } = await apiClient.get<Res<BalanceSheet>>('/accounting/balance-sheet', { params });
  return data.data;
}

export async function getReconciliation(): Promise<ReconciliationData> {
  const { data } = await apiClient.get<Res<ReconciliationData>>('/accounting/reconciliation');
  return data.data;
}

export async function matchBankTransaction(id: string, voucherId: string): Promise<BankTransaction> {
  const { data } = await apiClient.patch<Res<BankTransaction>>(`/accounting/reconciliation/${id}/match`, { voucherId });
  return data.data;
}

export async function excludeBankTransaction(id: string): Promise<BankTransaction> {
  const { data } = await apiClient.patch<Res<BankTransaction>>(`/accounting/reconciliation/${id}/exclude`);
  return data.data;
}

export async function getProjections(): Promise<Projection[]> {
  const { data } = await apiClient.get<Res<Projection[]>>('/accounting/projections');
  return data.data;
}
