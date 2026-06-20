import { AssetStatus, Prisma, Priority, Trade, WOStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { generateWoNumber } from '../../utils/woNumber';

interface ListWorkOrdersParams {
  trade?: Trade;
  priority?: Priority;
  status?: WOStatus;
  page: number;
  pageSize: number;
}

export async function listWorkOrders(params: ListWorkOrdersParams) {
  const where: Prisma.WorkOrderWhereInput = {
    ...(params.trade ? { trade: params.trade } : {}),
    ...(params.priority ? { priority: params.priority } : {}),
    ...(params.status ? { status: params.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: { unit: true, building: true },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.workOrder.count({ where }),
  ]);

  return { items, total, page: params.page, pageSize: params.pageSize };
}

interface CreateWorkOrderInput {
  unitId?: string;
  buildingId: string;
  trade: Trade;
  priority?: Priority;
  description: string;
  assignedToId?: string;
  scheduledAt?: Date;
  estimatedCost?: number;
  notes?: string;
}

export async function createWorkOrder(data: CreateWorkOrderInput) {
  const building = await prisma.building.findUnique({ where: { id: data.buildingId } });
  if (!building) throw new AppError(404, 'BUILDING_NOT_FOUND', 'Building not found');

  for (let attempt = 0; attempt < 3; attempt++) {
    const woNumber = await generateWoNumber();
    try {
      return await prisma.workOrder.create({ data: { ...data, woNumber } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        continue;
      }
      throw err;
    }
  }
  throw new AppError(500, 'WO_NUMBER_CONFLICT', 'Could not generate a unique work order number');
}

export async function getWorkOrder(id: string) {
  const wo = await prisma.workOrder.findUnique({ where: { id }, include: { unit: true, building: true } });
  if (!wo) throw new AppError(404, 'WORK_ORDER_NOT_FOUND', 'Work order not found');
  return wo;
}

export async function updateWorkOrder(id: string, data: Prisma.WorkOrderUpdateInput) {
  await getWorkOrder(id);
  const patch: Prisma.WorkOrderUpdateInput = { ...data };
  if (data.status === WOStatus.COMPLETED) {
    patch.completedAt = new Date();
  }
  return prisma.workOrder.update({ where: { id }, data: patch });
}

const SERVICE_DUE_WARNING_DAYS = 14;

function computeAssetStatus(asset: { status: AssetStatus; nextServiceDate: Date | null }): AssetStatus {
  if (asset.status === AssetStatus.OUT_OF_SERVICE) return AssetStatus.OUT_OF_SERVICE;
  if (!asset.nextServiceDate) return asset.status;

  const now = new Date();
  const warningThreshold = new Date(now.getTime() + SERVICE_DUE_WARNING_DAYS * 24 * 60 * 60 * 1000);

  if (asset.nextServiceDate < now) return AssetStatus.OVERDUE;
  if (asset.nextServiceDate <= warningThreshold) return AssetStatus.SERVICE_DUE;
  return AssetStatus.GOOD;
}

async function refreshAssetStatus<T extends { id: string; status: AssetStatus; nextServiceDate: Date | null }>(
  asset: T
): Promise<T> {
  const computed = computeAssetStatus(asset);
  if (computed !== asset.status) {
    await prisma.asset.update({ where: { id: asset.id }, data: { status: computed } });
    return { ...asset, status: computed };
  }
  return asset;
}

interface ListAssetsParams {
  buildingId?: string;
  category?: Trade;
  status?: AssetStatus;
}

export async function listAssets(params: ListAssetsParams) {
  const assets = await prisma.asset.findMany({
    where: {
      ...(params.buildingId ? { buildingId: params.buildingId } : {}),
      ...(params.category ? { category: params.category } : {}),
    },
    include: { building: true },
    orderBy: { name: 'asc' },
  });
  const refreshed = await Promise.all(assets.map(refreshAssetStatus));
  return params.status ? refreshed.filter((a) => a.status === params.status) : refreshed;
}

export async function createAsset(data: Prisma.AssetUncheckedCreateInput) {
  const building = await prisma.building.findUnique({ where: { id: data.buildingId } });
  if (!building) throw new AppError(404, 'BUILDING_NOT_FOUND', 'Building not found');
  return prisma.asset.create({ data });
}

export async function getAsset(id: string) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found');
  return refreshAssetStatus(asset);
}

export async function updateAsset(id: string, data: Prisma.AssetUpdateInput) {
  await getAsset(id);
  return prisma.asset.update({ where: { id }, data });
}

export async function listAssetsDueService(days: number) {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return prisma.asset.findMany({
    where: {
      nextServiceDate: { not: null, lte: threshold },
      status: { not: AssetStatus.OUT_OF_SERVICE },
    },
    include: { building: true },
    orderBy: { nextServiceDate: 'asc' },
  });
}
