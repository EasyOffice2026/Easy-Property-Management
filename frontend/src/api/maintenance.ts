import { apiClient } from './client';
import { Unit, Building } from './properties';

export type Trade = 'ELECTRICAL' | 'PLUMBING' | 'CARPENTRY' | 'MASONRY' | 'CLEANING' | 'OTHER';
export type Priority = 'EMERGENCY' | 'HIGH' | 'ROUTINE';
export type WOStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type AssetStatus = 'GOOD' | 'SERVICE_DUE' | 'OVERDUE' | 'OUT_OF_SERVICE';

export interface WorkOrder {
  id: string;
  woNumber: string;
  unitId?: string | null;
  unit?: Unit | null;
  buildingId: string;
  building?: Building;
  trade: Trade;
  priority: Priority;
  description: string;
  status: WOStatus;
  assignedToId?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  estimatedCost?: number | string | null;
  actualCost?: number | string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderListParams {
  trade?: Trade;
  priority?: Priority;
  status?: WOStatus;
  page?: number;
  pageSize?: number;
}

export interface WorkOrderListResult {
  items: WorkOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WorkOrderInput {
  unitId?: string;
  buildingId: string;
  trade: Trade;
  priority?: Priority;
  description: string;
  assignedToId?: string;
  scheduledAt?: string;
  estimatedCost?: number;
  notes?: string;
}

export interface WorkOrderUpdateInput {
  trade?: Trade;
  priority?: Priority;
  description?: string;
  status?: WOStatus;
  assignedToId?: string;
  scheduledAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
}

export async function listWorkOrders(params: WorkOrderListParams = {}) {
  const { data } = await apiClient.get<{ success: boolean; data: WorkOrderListResult }>('/work-orders', { params });
  return data.data;
}

export async function createWorkOrder(input: WorkOrderInput) {
  const { data } = await apiClient.post<{ success: boolean; data: WorkOrder }>('/work-orders', input);
  return data.data;
}

export async function updateWorkOrder(id: string, input: WorkOrderUpdateInput) {
  const { data } = await apiClient.put<{ success: boolean; data: WorkOrder }>(`/work-orders/${id}`, input);
  return data.data;
}

export interface Asset {
  id: string;
  buildingId: string;
  building?: Building;
  name: string;
  category: Trade;
  location: string;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  nextServiceDate?: string | null;
  status: AssetStatus;
  notes?: string | null;
}

export interface AssetListParams {
  buildingId?: string;
  category?: Trade;
  status?: AssetStatus;
}

export interface AssetInput {
  buildingId: string;
  name: string;
  category: Trade;
  location: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  nextServiceDate?: string;
  status?: AssetStatus;
  notes?: string;
}

export async function listAssets(params: AssetListParams = {}) {
  const { data } = await apiClient.get<{ success: boolean; data: Asset[] }>('/assets', { params });
  return data.data;
}

export async function createAsset(input: AssetInput) {
  const { data } = await apiClient.post<{ success: boolean; data: Asset }>('/assets', input);
  return data.data;
}

export async function updateAsset(id: string, input: Partial<AssetInput>) {
  const { data } = await apiClient.put<{ success: boolean; data: Asset }>(`/assets/${id}`, input);
  return data.data;
}
