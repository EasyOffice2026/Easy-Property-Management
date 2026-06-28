import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './service';

export const financialSummaryHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getFinancialSummary();
  res.json({ success: true, data });
});

export const revenueHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getRevenueEntries();
  res.json({ success: true, data });
});

export const expensesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getExpenseEntries();
  res.json({ success: true, data });
});

export const profitLossHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getProfitAndLoss();
  res.json({ success: true, data });
});

export const balanceSheetHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getBalanceSheet();
  res.json({ success: true, data });
});

export const cashFlowHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getCashFlow();
  res.json({ success: true, data });
});

export const projectionsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getProjections();
  res.json({ success: true, data });
});
