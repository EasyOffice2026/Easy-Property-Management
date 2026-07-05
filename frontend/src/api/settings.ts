import { apiClient } from './client';

export interface AppSettings {
  companyName: string;
  country: string;
  currency: string;
  defaultLanguage: string;
  contractNumberPrefix: string;
  expiryWarningDays: number;
  overdueGraceDays: number;
  autoLockOnSigning: boolean;
}

export async function getSettings(): Promise<AppSettings> {
  const { data } = await apiClient.get<{ success: boolean; data: AppSettings }>('/settings');
  return data.data;
}

export async function updateSettings(input: Partial<AppSettings>): Promise<AppSettings> {
  const { data } = await apiClient.put<{ success: boolean; data: AppSettings }>('/settings', input);
  return data.data;
}
