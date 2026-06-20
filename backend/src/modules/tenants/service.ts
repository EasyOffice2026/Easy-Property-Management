import { Prisma, TenantType } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/AppError';

interface ListTenantsParams {
  tenantType?: TenantType;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

export async function listTenants(params: ListTenantsParams) {
  const where: Prisma.TenantWhereInput = {
    ...(params.tenantType ? { tenantType: params.tenantType } : {}),
    ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.tenant.count({ where }),
  ]);

  return { items, total, page: params.page, pageSize: params.pageSize };
}

export async function createTenant(data: Prisma.TenantCreateInput) {
  return prisma.tenant.create({ data });
}

export async function getTenant(id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { documents: true },
  });
  if (!tenant) throw new AppError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
  return tenant;
}

export async function updateTenant(id: string, data: Prisma.TenantUpdateInput) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new AppError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
  return prisma.tenant.update({ where: { id }, data });
}

export async function addTenantDocument(tenantId: string, type: string, fileUrl: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new AppError(404, 'TENANT_NOT_FOUND', 'Tenant not found');
  return prisma.document.create({ data: { tenantId, type, fileUrl } });
}
