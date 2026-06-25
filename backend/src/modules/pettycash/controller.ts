import { Request, Response } from 'express';
import { z } from 'zod';
import { PettyCashCategory, PettyCashStatus, PettyCashTransactionType } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import * as service from './service';

const transactionSchema = z.object({
  buildingId: z.string().uuid().optional(),
  type: z.nativeEnum(PettyCashTransactionType),
  category: z.nativeEnum(PettyCashCategory),
  amount: z.number().positive(),
  description: z.string().min(1),
  receiptUrl: z.string().optional(),
  occurredAt: z.coerce.date().optional(),
});

const listQuerySchema = z.object({
  buildingId: z.string().uuid().optional(),
  type: z.nativeEnum(PettyCashTransactionType).optional(),
  category: z.nativeEnum(PettyCashCategory).optional(),
  status: z.nativeEnum(PettyCashStatus).optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

const approveSchema = z.object({
  status: z.enum([PettyCashStatus.APPROVED, PettyCashStatus.REJECTED]),
});

export const listTransactionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await service.listTransactions(query);
  res.json({ success: true, data: result });
});

export const monthlySummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const month = z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional()
    .parse(req.query.month);
  const summary = await service.getMonthlySummary(month);
  res.json({ success: true, data: summary });
});

export const createTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = transactionSchema.parse(req.body);
  const tx = await service.createTransaction({ ...data, requestedBy: req.user.id });
  res.status(201).json({ success: true, data: tx });
});

export const approveTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { status } = approveSchema.parse(req.body);
  const tx = await service.approveTransaction(req.params.id, req.user.id, status);
  res.json({ success: true, data: tx });
});
