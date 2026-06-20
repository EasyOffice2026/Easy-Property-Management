import { apiClient } from './client';

export type TenantType = 'INDIVIDUAL' | 'COMPANY';

export interface TenantDocument {
  id: string;
  tenantId: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Tenant {
  id: string;
  tenantType: TenantType;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  nationality: string;
  email: string;
  phone?: string | null;
  mobile: string;
  civilId?: string | null;
  passportNumber?: string | null;
  emergencyContact?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  documents?: TenantDocument[];
}

export interface TenantListParams {
  tenantType?: TenantType;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface TenantListResult {
  items: Tenant[];
  total: number;
  page: number;
  pageSize: number;
}

export type TenantInput = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'documents'>;

export async function listTenants(params: TenantListParams = {}) {
  const { data } = await apiClient.get<{ success: boolean; data: TenantListResult }>('/tenants', { params });
  return data.data;
}

export async function getTenant(id: string) {
  const { data } = await apiClient.get<{ success: boolean; data: Tenant }>(`/tenants/${id}`);
  return data.data;
}

export async function createTenant(input: Partial<TenantInput>) {
  const { data } = await apiClient.post<{ success: boolean; data: Tenant }>('/tenants', input);
  return data.data;
}

export async function updateTenant(id: string, input: Partial<TenantInput>) {
  const { data } = await apiClient.put<{ success: boolean; data: Tenant }>(`/tenants/${id}`, input);
  return data.data;
}

export async function uploadTenantDocument(id: string, type: string, file: File) {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);
  const { data } = await apiClient.post<{ success: boolean; data: TenantDocument }>(
    `/tenants/${id}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data.data;
}
