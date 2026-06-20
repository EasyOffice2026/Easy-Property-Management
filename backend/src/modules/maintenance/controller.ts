import { Request, Response } from 'express';
import { z } from 'zod';
import { AssetStatus, Priority, Trade, WOStatus } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './service';

const workOrderSchema = z.object({
  unitId: z.string().uuid().optional(),
  buildingId: z.string().uuid(),
  trade: z.nativeEnum(Trade),
  priority: z.nativeEnum(Priority).optional(),
  description: z.string().min(1),
  assignedToId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const workOrderUpdateSchema = z.object({
  trade: z.nativeEnum(Trade).optional(),
  priority: z.nativeEnum(Priority).optional(),
  description: z.string().min(1).optional(),
  status: z.nativeEnum(WOStatus).optional(),
  assignedToId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  actualCost: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const listQuerySchema = z.object({
  trade: z.nativeEnum(Trade).optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(WOStatus).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const listWorkOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await service.listWorkOrders(query);
  res.json({ success: true, data: result });
});

export const createWorkOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = workOrderSchema.parse(req.body);
  const wo = await service.createWorkOrder(data);
  res.status(201).json({ success: true, data: wo });
});

export const getWorkOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const wo = await service.getWorkOrder(req.params.id);
  res.json({ success: true, data: wo });
});

export const updateWorkOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = workOrderUpdateSchema.parse(req.body);
  const wo = await service.updateWorkOrder(req.params.id, data);
  res.json({ success: true, data: wo });
});

const assetSchema = z.object({
  buildingId: z.string().uuid(),
  name: z.string().min(1),
  category: z.nativeEnum(Trade),
  location: z.string().min(1),
  purchaseDate: z.coerce.date().optional(),
  warrantyExpiry: z.coerce.date().optional(),
  nextServiceDate: z.coerce.date().optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  notes: z.string().optional(),
});

const assetListQuerySchema = z.object({
  buildingId: z.string().uuid().optional(),
  category: z.nativeEnum(Trade).optional(),
  status: z.nativeEnum(AssetStatus).optional(),
});

export const listAssetsHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = assetListQuerySchema.parse(req.query);
  const assets = await service.listAssets(query);
  res.json({ success: true, data: assets });
});

export const createAssetHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = assetSchema.parse(req.body);
  const asset = await service.createAsset(data);
  res.status(201).json({ success: true, data: asset });
});

export const updateAssetHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = assetSchema.partial().parse(req.body);
  const asset = await service.updateAsset(req.params.id, data);
  res.json({ success: true, data: asset });
});

export const assetsDueServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const days = z.coerce.number().int().positive().optional().default(14).parse(req.query.days);
  const assets = await service.listAssetsDueService(days);
  res.json({ success: true, data: assets });
});
