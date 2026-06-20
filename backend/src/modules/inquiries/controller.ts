import { Request, Response } from 'express';
import { z } from 'zod';
import { InquiryChannel, InquiryStatus, RentPeriod, TenantType, UnitType } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './service';

const inquirySchema = z.object({
  tenantType: z.nativeEnum(TenantType),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  mobile: z.string().min(1),
  email: z.string().email().optional(),
  channel: z.nativeEnum(InquiryChannel),
  unitTypeInterest: z.nativeEnum(UnitType).optional(),
  rentPeriod: z.nativeEnum(RentPeriod).optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(InquiryStatus).optional(),
  assignedToId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
});

const listQuerySchema = z.object({
  status: z.nativeEnum(InquiryStatus).optional(),
  channel: z.nativeEnum(InquiryChannel).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const listInquiriesHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await service.listInquiries(query);
  res.json({ success: true, data: result });
});

export const createInquiryHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = inquirySchema.parse(req.body);
  const inquiry = await service.createInquiry(data);
  res.status(201).json({ success: true, data: inquiry });
});

export const updateInquiryHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = inquirySchema.partial().parse(req.body);
  const inquiry = await service.updateInquiry(req.params.id, data);
  res.json({ success: true, data: inquiry });
});

export const deleteInquiryHandler = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteInquiry(req.params.id);
  res.json({ success: true, data: { id: req.params.id } });
});
