import { apiClient } from './client';
import { Tenant } from './tenants';
import { Unit } from './properties';
import { RentPeriod } from './inquiries';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'TERMINATED' | 'CLEARED';

export interface Contract {
  id: string;
  contractNumber: string;
  tenantId: string;
  tenant?: Tenant;
  unitId: string;
  unit?: Unit & { building?: { nameEn: string; nameAr: string } };
  rentPeriod: RentPeriod;
  rentAmount: number | string;
  securityDeposit: number | string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  signedAt?: string | null;
  clearedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractListParams {
  status?: ContractStatus;
  rentPeriod?: RentPeriod;
  page?: number;
  pageSize?: number;
}

export interface ContractListResult {
  items: Contract[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContractInput {
  tenantId: string;
  unitId: string;
  rentPeriod: RentPeriod;
  rentAmount: number;
  securityDeposit?: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

export async function listContracts(params: ContractListParams = {}) {
  const { data } = await apiClient.get<{ success: boolean; data: ContractListResult }>('/contracts', { params });
  return data.data;
}

export async function createContract(input: ContractInput) {
  const { data } = await apiClient.post<{ success: boolean; data: Contract }>('/contracts', input);
  return data.data;
}

export async function signContract(id: string) {
  const { data } = await apiClient.post<{ success: boolean; data: Contract }>(`/contracts/${id}/sign`);
  return data.data;
}

export async function clearContract(id: string) {
  const { data } = await apiClient.post<{ success: boolean; data: Contract }>(`/contracts/${id}/clear`);
  return data.data;
}

export async function terminateContract(id: string) {
  const { data } = await apiClient.post<{ success: boolean; data: Contract }>(`/contracts/${id}/terminate`);
  return data.data;
}

export async function renewContract(id: string) {
  const { data } = await apiClient.post<{ success: boolean; data: Contract }>(`/contracts/${id}/renew`);
  return data.data;
}

export async function downloadContractPdf(id: string, contractNumber: string) {
  const { data } = await apiClient.get(`/contracts/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${contractNumber}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}
