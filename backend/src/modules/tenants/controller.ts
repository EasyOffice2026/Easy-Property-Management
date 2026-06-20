import { Request, Response } from 'express';
import { z } from 'zod';
import { TenantType } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { toPublicUrl } from '../../utils/fileStorage';
import * as service from './service';

const tenantSchema = z.object({
  tenantType: z.nativeEnum(TenantType),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  nationality: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  mobile: z.string().min(1),
  civilId: z.string().optional(),
  passportNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  isActive: z.boolean().optional(),
});

const listQuerySchema = z.object({
  tenantType: z.nativeEnum(TenantType).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const listTenantsHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await service.listTenants(query);
  res.json({ success: true, data: result });
});

export const createTenantHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = tenantSchema.parse(req.body);
  const tenant = await service.createTenant(data);
  res.status(201).json({ success: true, data: tenant });
});

export const getTenantHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await service.getTenant(req.params.id);
  res.json({ success: true, data: tenant });
});

export const updateTenantHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = tenantSchema.partial().parse(req.body);
  const tenant = await service.updateTenant(req.params.id, data);
  res.json({ success: true, data: tenant });
});

export const uploadTenantDocumentHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'FILE_REQUIRED', 'A document file is required');
  }
  const type = z.string().min(1).parse(req.body.type);
  const document = await service.addTenantDocument(req.params.id, type, toPublicUrl(req.file.filename));
  res.status(201).json({ success: true, data: document });
});
