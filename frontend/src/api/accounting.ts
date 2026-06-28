import { apiClient } from './client';

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingReceivables: number;
  outstandingPayables: number;
}

export interface RevenueEntry {
  id: string;
  date: string;
  contractNumber: string;
  tenantName: string;
  unitNumber: string;
  description: string;
  amount: number;
  paymentMethod: string | null;
  status: 'PAID' | 'UNPAID';
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  status: string;
  buildingName: string | null;
}

export interface ProfitAndLoss {
  month: string;
  revenue: { rentalIncome: number; total: number };
  expenses: { breakdown: { category: string; amount: number }[]; total: number };
  netProfit: number;
}

export interface BalanceSheet {
  assets: {
    cashAndBank: number;
    accountsReceivable: number;
    securityDeposits: number;
    propertyAssets: number;
    furnitureAndEquipment: number;
  };
  liabilities: {
    accountsPayable: number;
    advanceRents: number;
    longTermLoans: number;
  };
  equity: {
    ownersEquity: number;
    retainedEarnings: number;
  };
}

export interface CashFlow {
  operating: { rentCollected: number; expensesPaid: number; net: number };
  investing: { assetPurchases: number };
  financing: { loanRepayment: number };
  netCashIncrease: number;
}

export interface Projection {
  month: string;
  occupancy: number;
  revenue: number;
  expenses: number;
  profit: number;
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const { data } = await apiClient.get<{ success: boolean; data: FinancialSummary }>('/accounting/summary');
  return data.data;
}

export async function getRevenueEntries(): Promise<RevenueEntry[]> {
  const { data } = await apiClient.get<{ success: boolean; data: RevenueEntry[] }>('/accounting/revenue');
  return data.data;
}

export async function getExpenseEntries(): Promise<ExpenseEntry[]> {
  const { data } = await apiClient.get<{ success: boolean; data: ExpenseEntry[] }>('/accounting/expenses');
  return data.data;
}

export async function getProfitAndLoss(): Promise<ProfitAndLoss> {
  const { data } = await apiClient.get<{ success: boolean; data: ProfitAndLoss }>('/accounting/profit-loss');
  return data.data;
}

export async function getBalanceSheet(): Promise<BalanceSheet> {
  const { data } = await apiClient.get<{ success: boolean; data: BalanceSheet }>('/accounting/balance-sheet');
  return data.data;
}

export async function getCashFlow(): Promise<CashFlow> {
  const { data } = await apiClient.get<{ success: boolean; data: CashFlow }>('/accounting/cash-flow');
  return data.data;
}

export async function getProjections(): Promise<Projection[]> {
  const { data } = await apiClient.get<{ success: boolean; data: Projection[] }>('/accounting/projections');
  return data.data;
}
