import { apiClient } from './client';
import { Building } from './properties';

export type PettyCashType = 'REPLENISHMENT' | 'EXPENSE';
export type PettyCashCategory = 'MAINTENANCE' | 'SUPPLIES' | 'UTILITIES' | 'TRANSPORT' | 'OFFICE' | 'OTHER';
export type PettyCashStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PettyCashTransaction {
  id: string;
  buildingId?: string | null;
  building?: Building | null;
  type: PettyCashType;
  category: PettyCashCategory;
  amount: number | string;
  description: string;
  receiptUrl?: string | null;
  requestedBy: string;
  approvedBy?: string | null;
  status: PettyCashStatus;
  occurredAt: string;
  createdAt: string;
}

export interface PettyCashListParams {
  buildingId?: string;
  type?: PettyCashType;
  category?: PettyCashCategory;
  status?: PettyCashStatus;
  month?: string;
  page?: number;
  pageSize?: number;
}

export interface PettyCashListResult {
  items: PettyCashTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PettyCashSummary {
  monthlyLimit: number;
  replenished: number;
  spent: number;
  remaining: number;
}

export interface PettyCashInput {
  buildingId?: string;
  type: PettyCashType;
  category: PettyCashCategory;
  amount: number;
  description: string;
  occurredAt?: string;
}

export async function listPettyCash(params: PettyCashListParams = {}) {
  const { data } = await apiClient.get<{ success: boolean; data: PettyCashListResult }>('/petty-cash', { params });
  return data.data;
}

export async function getPettyCashSummary(month?: string) {
  const { data } = await apiClient.get<{ success: boolean; data: PettyCashSummary }>('/petty-cash/summary', {
    params: { month },
  });
  return data.data;
}

export async function createPettyCash(input: PettyCashInput) {
  const { data } = await apiClient.post<{ success: boolean; data: PettyCashTransaction }>('/petty-cash', input);
  return data.data;
}

export async function setPettyCashStatus(id: string, status: 'APPROVED' | 'REJECTED') {
  const { data } = await apiClient.put<{ success: boolean; data: PettyCashTransaction }>(
    `/petty-cash/${id}/status`,
    { status }
  );
  return data.data;
}
