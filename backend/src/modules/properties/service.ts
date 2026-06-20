import { Prisma, UnitStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/AppError';

export async function listBuildings() {
  return prisma.building.findMany({
    where: { isActive: true },
    include: { units: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createBuilding(data: Prisma.BuildingCreateInput) {
  return prisma.building.create({ data });
}

export async function getBuilding(id: string) {
  const building = await prisma.building.findUnique({ where: { id }, include: { units: true } });
  if (!building) throw new AppError(404, 'BUILDING_NOT_FOUND', 'Building not found');
  return building;
}

export async function updateBuilding(id: string, data: Prisma.BuildingUpdateInput) {
  await getBuilding(id);
  return prisma.building.update({ where: { id }, data });
}

export async function listUnitsByBuilding(buildingId: string) {
  await getBuilding(buildingId);
  return prisma.unit.findMany({ where: { buildingId }, orderBy: { unitNumber: 'asc' } });
}

export async function createUnit(data: Prisma.UnitUncheckedCreateInput) {
  await getBuilding(data.buildingId);
  return prisma.unit.create({ data });
}

export async function updateUnit(id: string, data: Prisma.UnitUpdateInput) {
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit not found');
  return prisma.unit.update({ where: { id }, data });
}

export async function listAvailableUnits() {
  return prisma.unit.findMany({
    where: { status: UnitStatus.AVAILABLE },
    include: { building: true },
    orderBy: { unitNumber: 'asc' },
  });
}
