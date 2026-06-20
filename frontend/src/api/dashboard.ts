import { apiClient } from './client';

export interface DashboardKpis {
  buildingCount: number;
  totalUnits: number;
  unitsByStatus: Record<string, number>;
  occupancyRate: number;
  tenantCount: number;
}

export async function getDashboardKpis() {
  const { data } = await apiClient.get<{ success: boolean; data: DashboardKpis }>('/dashboard');
  return data.data;
}
