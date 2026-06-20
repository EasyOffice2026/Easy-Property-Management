import { apiClient } from './client';

export interface ExpiringContract {
  id: string;
  contractNumber: string;
  endDate: string;
  tenant: { firstName: string | null; lastName: string | null; companyName: string | null };
  unit: { unitNumber: string };
}

export interface DashboardKpis {
  buildingCount: number;
  totalUnits: number;
  unitsByStatus: Record<string, number>;
  occupancyRate: number;
  tenantCount: number;
  activeContractCount: number;
  expiringContracts: ExpiringContract[];
}

export async function getDashboardKpis() {
  const { data } = await apiClient.get<{ success: boolean; data: DashboardKpis }>('/dashboard');
  return data.data;
}
