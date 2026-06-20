import { Request, Response } from 'express';
import { z } from 'zod';
import { ContractStatus, RentPeriod } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { streamContractPdf } from '../../utils/pdf';
import * as service from './service';

const contractSchema = z.object({
  tenantId: z.string().uuid(),
  unitId: z.string().uuid(),
  rentPeriod: z.nativeEnum(RentPeriod),
  rentAmount: z.number().nonnegative(),
  securityDeposit: z.number().nonnegative().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  notes: z.string().optional(),
});

const listQuerySchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
  rentPeriod: z.nativeEnum(RentPeriod).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const listContractsHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await service.listContracts(query);
  res.json({ success: true, data: result });
});

export const createContractHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = contractSchema.parse(req.body);
  const contract = await service.createContract(data);
  res.status(201).json({ success: true, data: contract });
});

export const getContractHandler = asyncHandler(async (req: Request, res: Response) => {
  const contract = await service.getContract(req.params.id);
  res.json({ success: true, data: contract });
});

export const signContractHandler = asyncHandler(async (req: Request, res: Response) => {
  const contract = await service.signContract(req.params.id, req.user!.id);
  res.json({ success: true, data: contract });
});

export const clearContractHandler = asyncHandler(async (req: Request, res: Response) => {
  const contract = await service.clearContract(req.params.id, req.user!.id);
  res.json({ success: true, data: contract });
});

export const terminateContractHandler = asyncHandler(async (req: Request, res: Response) => {
  const contract = await service.terminateContract(req.params.id, req.user!.id);
  res.json({ success: true, data: contract });
});

export const renewContractHandler = asyncHandler(async (req: Request, res: Response) => {
  const contract = await service.renewContract(req.params.id);
  res.status(201).json({ success: true, data: contract });
});

export const expiringContractsHandler = asyncHandler(async (req: Request, res: Response) => {
  const days = z.coerce.number().int().positive().optional().default(30).parse(req.query.days);
  const contracts = await service.listExpiringContracts(days);
  res.json({ success: true, data: contracts });
});

export const contractPdfHandler = asyncHandler(async (req: Request, res: Response) => {
  const contract = await service.getContract(req.params.id);
  streamContractPdf(res, contract);
});
