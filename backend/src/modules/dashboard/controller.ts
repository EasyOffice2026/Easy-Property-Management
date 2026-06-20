import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './service';

export const getDashboardHandler = asyncHandler(async (_req: Request, res: Response) => {
  const kpis = await service.getDashboardKpis();
  res.json({ success: true, data: kpis });
});
