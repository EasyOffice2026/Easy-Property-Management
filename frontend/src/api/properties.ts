import { apiClient } from './client';

export type UnitType = 'STUDIO' | 'ONE_BED' | 'TWO_BED' | 'THREE_BED' | 'PENTHOUSE';
export type UnitStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface Unit {
  id: string;
  buildingId: string;
  unitNumber: string;
  floor: number;
  type: UnitType;
  status: UnitStatus;
  rentAmount: number;
  furnished: boolean;
  notes?: string | null;
}

export interface Building {
  id: string;
  nameEn: string;
  nameAr: string;
  address: string;
  totalFloors: number;
  facilities: string[];
  units?: Unit[];
}

export async function listBuildings() {
  const { data } = await apiClient.get<{ success: boolean; data: Building[] }>('/buildings');
  return data.data;
}

export async function getBuilding(id: string) {
  const { data } = await apiClient.get<{ success: boolean; data: Building }>(`/buildings/${id}`);
  return data.data;
}

export async function listUnitsByBuilding(buildingId: string) {
  const { data } = await apiClient.get<{ success: boolean; data: Unit[] }>(`/buildings/${buildingId}/units`);
  return data.data;
}

export async function listAvailableUnits() {
  const { data } = await apiClient.get<{ success: boolean; data: (Unit & { building: Building })[] }>(
    '/units/available'
  );
  return data.data;
}
