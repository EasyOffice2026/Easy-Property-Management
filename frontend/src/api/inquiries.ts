import { apiClient } from './client';
import { TenantType } from './tenants';
import { UnitType } from './properties';

export type InquiryChannel = 'WEBSITE' | 'WHATSAPP' | 'INSTAGRAM' | 'CALL_CENTER' | 'WALK_IN';
export type InquiryStatus = 'NEW' | 'IN_PROGRESS' | 'QUOTED' | 'CONVERTED' | 'LOST';
export type RentPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Inquiry {
  id: string;
  tenantType: TenantType;
  firstName: string;
  lastName?: string | null;
  companyName?: string | null;
  mobile: string;
  email?: string | null;
  channel: InquiryChannel;
  unitTypeInterest?: UnitType | null;
  rentPeriod?: RentPeriod | null;
  notes?: string | null;
  status: InquiryStatus;
  assignedToId?: string | null;
  tenantId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InquiryInput = Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>;

export interface InquiryListParams {
  status?: InquiryStatus;
  channel?: InquiryChannel;
  page?: number;
  pageSize?: number;
}

export interface InquiryListResult {
  items: Inquiry[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listInquiries(params: InquiryListParams = {}) {
  const { data } = await apiClient.get<{ success: boolean; data: InquiryListResult }>('/inquiries', { params });
  return data.data;
}

export async function createInquiry(input: Partial<InquiryInput>) {
  const { data } = await apiClient.post<{ success: boolean; data: Inquiry }>('/inquiries', input);
  return data.data;
}

export async function updateInquiry(id: string, input: Partial<InquiryInput>) {
  const { data } = await apiClient.put<{ success: boolean; data: Inquiry }>(`/inquiries/${id}`, input);
  return data.data;
}

export async function deleteInquiry(id: string) {
  await apiClient.delete(`/inquiries/${id}`);
}
