import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './service';

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  defaultLanguage: z.string().min(1).optional(),
  contractNumberPrefix: z.string().min(1).optional(),
  expiryWarningDays: z.number().int().positive().optional(),
  overdueGraceDays: z.number().int().nonnegative().optional(),
  autoLockOnSigning: z.boolean().optional(),
});

export const getSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const settings = service.getSettings();
  res.json({ success: true, data: settings });
});

export const updateSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSchema.parse(req.body);
  const settings = service.updateSettings(data);
  res.json({ success: true, data: settings });
});
