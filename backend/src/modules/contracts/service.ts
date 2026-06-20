import { ContractStatus, Prisma, UnitStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { generateContractNumber } from '../../utils/contractNumber';

interface ListContractsParams {
  status?: ContractStatus;
  rentPeriod?: Prisma.ContractWhereInput['rentPeriod'];
  page: number;
  pageSize: number;
}

export async function listContracts(params: ListContractsParams) {
  const where: Prisma.ContractWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.rentPeriod ? { rentPeriod: params.rentPeriod } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      include: { tenant: true, unit: { include: { building: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.contract.count({ where }),
  ]);

  return { items, total, page: params.page, pageSize: params.pageSize };
}

export async function getContract(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { tenant: true, unit: { include: { building: true } } },
  });
  if (!contract) throw new AppError(404, 'CONTRACT_NOT_FOUND', 'Contract not found');
  return contract;
}

interface CreateContractInput {
  tenantId: string;
  unitId: string;
  rentPeriod: Prisma.ContractCreateInput['rentPeriod'];
  rentAmount: number;
  securityDeposit?: number;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

export async function createContract(data: CreateContractInput, options: { skipAvailabilityCheck?: boolean } = {}) {
  const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
  if (!unit) throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit not found');
  if (!options.skipAvailabilityCheck && unit.status !== UnitStatus.AVAILABLE) {
    throw new AppError(400, 'UNIT_NOT_AVAILABLE', 'The selected unit is currently occupied');
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
  if (!tenant) throw new AppError(404, 'TENANT_NOT_FOUND', 'Tenant not found');

  for (let attempt = 0; attempt < 3; attempt++) {
    const contractNumber = await generateContractNumber();
    try {
      return await prisma.contract.create({
        data: {
          contractNumber,
          tenantId: data.tenantId,
          unitId: data.unitId,
          rentPeriod: data.rentPeriod,
          rentAmount: data.rentAmount,
          securityDeposit: data.securityDeposit ?? 0,
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        continue;
      }
      throw err;
    }
  }
  throw new AppError(500, 'CONTRACT_NUMBER_CONFLICT', 'Could not generate a unique contract number');
}

export async function signContract(contractId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const contract = await tx.contract.findUnique({ where: { id: contractId }, include: { unit: true } });
    if (!contract) throw new AppError(404, 'CONTRACT_NOT_FOUND', 'Contract not found');
    if (contract.status !== ContractStatus.DRAFT) {
      throw new AppError(400, 'CONTRACT_NOT_DRAFT', 'Contract is not in DRAFT status');
    }
    if (contract.unit.status !== UnitStatus.AVAILABLE) {
      throw new AppError(400, 'UNIT_NOT_AVAILABLE', 'The selected unit is currently occupied');
    }

    const updated = await tx.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.ACTIVE, signedAt: new Date() },
    });
    await tx.unit.update({
      where: { id: contract.unitId },
      data: { status: UnitStatus.OCCUPIED },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: 'CONTRACT_SIGNED',
        entity: 'Contract',
        entityId: contractId,
        details: { contractNumber: contract.contractNumber, unitId: contract.unitId },
      },
    });
    return updated;
  });
}

async function releaseUnit(
  contractId: string,
  userId: string,
  targetStatus: typeof ContractStatus.CLEARED | typeof ContractStatus.TERMINATED,
  action: string
) {
  return prisma.$transaction(async (tx) => {
    const contract = await tx.contract.findUnique({ where: { id: contractId }, include: { unit: true } });
    if (!contract) throw new AppError(404, 'CONTRACT_NOT_FOUND', 'Contract not found');
    if (contract.status !== ContractStatus.ACTIVE && contract.status !== ContractStatus.EXPIRING) {
      throw new AppError(400, 'CONTRACT_NOT_ACTIVE', 'Contract is not active');
    }

    const updated = await tx.contract.update({
      where: { id: contractId },
      data: { status: targetStatus, clearedAt: new Date() },
    });
    await tx.unit.update({
      where: { id: contract.unitId },
      data: { status: UnitStatus.AVAILABLE },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action,
        entity: 'Contract',
        entityId: contractId,
        details: { contractNumber: contract.contractNumber, unitId: contract.unitId },
      },
    });
    return updated;
  });
}

export async function clearContract(contractId: string, userId: string) {
  return releaseUnit(contractId, userId, ContractStatus.CLEARED, 'CONTRACT_CLEARED');
}

export async function terminateContract(contractId: string, userId: string) {
  return releaseUnit(contractId, userId, ContractStatus.TERMINATED, 'CONTRACT_TERMINATED');
}

export async function renewContract(contractId: string) {
  const existing = await getContract(contractId);
  const durationMs = existing.endDate.getTime() - existing.startDate.getTime();
  const newStart = new Date(existing.endDate);
  const newEnd = new Date(newStart.getTime() + durationMs);

  return createContract(
    {
      tenantId: existing.tenantId,
      unitId: existing.unitId,
      rentPeriod: existing.rentPeriod,
      rentAmount: Number(existing.rentAmount),
      securityDeposit: Number(existing.securityDeposit),
      startDate: newStart,
      endDate: newEnd,
      notes: existing.notes ?? undefined,
    },
    { skipAvailabilityCheck: true }
  );
}

export async function listExpiringContracts(days: number) {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return prisma.contract.findMany({
    where: {
      status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING] },
      endDate: { gte: now, lte: threshold },
    },
    include: { tenant: true, unit: { include: { building: true } } },
    orderBy: { endDate: 'asc' },
  });
}
