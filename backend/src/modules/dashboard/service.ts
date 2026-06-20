import { UnitStatus } from '@prisma/client';
import { prisma } from '../../config/db';

export async function getDashboardKpis() {
  const [buildingCount, unitsByStatus, tenantCount] = await Promise.all([
    prisma.building.count({ where: { isActive: true } }),
    prisma.unit.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.tenant.count({ where: { isActive: true } }),
  ]);

  const statusCounts: Record<UnitStatus, number> = {
    AVAILABLE: 0,
    OCCUPIED: 0,
    MAINTENANCE: 0,
    OUT_OF_SERVICE: 0,
  };
  for (const row of unitsByStatus) {
    statusCounts[row.status] = row._count._all;
  }

  const totalUnits = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const occupancyRate = totalUnits > 0 ? statusCounts.OCCUPIED / totalUnits : 0;

  return {
    buildingCount,
    totalUnits,
    unitsByStatus: statusCounts,
    occupancyRate,
    tenantCount,
  };
}
