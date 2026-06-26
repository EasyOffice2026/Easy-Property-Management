import { ContractStatus, RentPeriod, UnitStatus, WOStatus } from '@prisma/client';
import { prisma } from '../../config/db';

const EXPIRY_WARNING_DAYS = Number(process.env.EXPIRY_WARNING_DAYS ?? 30);

const MONTHLY_EQUIVALENT: Record<RentPeriod, number> = {
  DAILY: 30,
  WEEKLY: 4.345,
  MONTHLY: 1,
  YEARLY: 1 / 12,
};

function toMonthlyRent(rentAmount: number, rentPeriod: RentPeriod) {
  return rentAmount * MONTHLY_EQUIVALENT[rentPeriod];
}

async function getMonthlyRevenueTrend(months = 6) {
  const now = new Date();
  const contracts = await prisma.contract.findMany({
    where: { status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING, ContractStatus.CLEARED, ContractStatus.EXPIRED] } },
    select: { rentAmount: true, rentPeriod: true, startDate: true, endDate: true },
  });

  const trend: { month: string; revenue: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const revenue = contracts.reduce((sum, c) => {
      const active = new Date(c.startDate) <= monthEnd && new Date(c.endDate) >= monthStart;
      return active ? sum + toMonthlyRent(Number(c.rentAmount), c.rentPeriod) : sum;
    }, 0);
    trend.push({ month: monthStart.toISOString().slice(0, 7), revenue: Math.round(revenue * 1000) / 1000 });
  }
  return trend;
}

export async function getDashboardKpis() {
  const expiringThreshold = new Date(Date.now() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);

  const [
    buildingCount,
    unitsByStatus,
    tenantCount,
    activeContractCount,
    expiringContracts,
    openWorkOrdersByPriority,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.building.count({ where: { isActive: true } }),
    prisma.unit.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.contract.count({ where: { status: ContractStatus.ACTIVE } }),
    prisma.contract.findMany({
      where: {
        status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING] },
        endDate: { gte: new Date(), lte: expiringThreshold },
      },
      include: { tenant: true, unit: true },
      orderBy: { endDate: 'asc' },
      take: 10,
    }),
    prisma.workOrder.groupBy({
      by: ['priority'],
      _count: { _all: true },
      where: { status: { notIn: [WOStatus.COMPLETED, WOStatus.CANCELLED] } },
    }),
    getMonthlyRevenueTrend(),
  ]);

  const openWorkOrders = { EMERGENCY: 0, HIGH: 0, ROUTINE: 0 };
  for (const row of openWorkOrdersByPriority) {
    openWorkOrders[row.priority] = row._count._all;
  }

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
    activeContractCount,
    expiringContracts,
    openWorkOrders,
    monthlyRevenue,
  };
}
