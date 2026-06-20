import { Request, Response } from 'express';
import { z } from 'zod';
import { UnitStatus, UnitType } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './service';

const buildingSchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  address: z.string().min(1),
  totalFloors: z.number().int().positive(),
  facilities: z.array(z.string()).default([]),
  managerId: z.string().uuid().optional(),
});

const unitSchema = z.object({
  buildingId: z.string().uuid(),
  unitNumber: z.string().min(1),
  floor: z.number().int().nonnegative(),
  type: z.nativeEnum(UnitType),
  status: z.nativeEnum(UnitStatus).optional(),
  rentAmount: z.number().nonnegative(),
  furnished: z.boolean().optional(),
  notes: z.string().optional(),
});

export const listBuildingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const buildings = await service.listBuildings();
  res.json({ success: true, data: buildings });
});

export const createBuildingHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = buildingSchema.parse(req.body);
  const building = await service.createBuilding(data);
  res.status(201).json({ success: true, data: building });
});

export const getBuildingHandler = asyncHandler(async (req: Request, res: Response) => {
  const building = await service.getBuilding(req.params.id);
  res.json({ success: true, data: building });
});

export const updateBuildingHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = buildingSchema.partial().parse(req.body);
  const building = await service.updateBuilding(req.params.id, data);
  res.json({ success: true, data: building });
});

export const listUnitsByBuildingHandler = asyncHandler(async (req: Request, res: Response) => {
  const units = await service.listUnitsByBuilding(req.params.id);
  res.json({ success: true, data: units });
});

export const createUnitHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = unitSchema.parse(req.body);
  const unit = await service.createUnit(data);
  res.status(201).json({ success: true, data: unit });
});

export const updateUnitHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = unitSchema.partial().omit({ buildingId: true }).parse(req.body);
  const unit = await service.updateUnit(req.params.id, data);
  res.json({ success: true, data: unit });
});

export const listAvailableUnitsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const units = await service.listAvailableUnits();
  res.json({ success: true, data: units });
});
