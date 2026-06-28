import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './service';

// Chart of Accounts
export const accountTreeHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getAccountTree();
  res.json({ success: true, data });
});

export const accountByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getAccountById(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: 'Account not found' });
  res.json({ success: true, data });
});

export const createAccountHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createAccount(req.body);
  res.status(201).json({ success: true, data });
});

export const updateAccountHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateAccount(req.params.id, req.body);
  res.json({ success: true, data });
});

// Journal Entries
export const journalEntriesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getJournalEntries({
    status: req.query.status as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  } as Parameters<typeof service.getJournalEntries>[0]);
  res.json({ success: true, data });
});

export const journalEntryByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getJournalEntryById(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: 'Journal entry not found' });
  res.json({ success: true, data });
});

export const createJournalEntryHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createJournalEntry({
    ...req.body,
    createdById: req.user!.id,
  });
  res.status(201).json({ success: true, data });
});

export const postJournalEntryHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.postJournalEntry(req.params.id);
  res.json({ success: true, data });
});

export const voidJournalEntryHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.voidJournalEntry(req.params.id);
  res.json({ success: true, data });
});

// Vouchers
export const vouchersHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getVouchers({
    type: req.query.type as string | undefined,
    status: req.query.status as string | undefined,
  } as Parameters<typeof service.getVouchers>[0]);
  res.json({ success: true, data });
});

export const voucherByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getVoucherById(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: 'Voucher not found' });
  res.json({ success: true, data });
});

export const createVoucherHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createVoucher({
    ...req.body,
    createdById: req.user!.id,
  });
  res.status(201).json({ success: true, data });
});

export const approveVoucherHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.approveVoucher(req.params.id);
  res.json({ success: true, data });
});

export const voidVoucherHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.voidVoucher(req.params.id);
  res.json({ success: true, data });
});

// Ledger
export const ledgerHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getLedger(
    req.params.accountId,
    req.query.from as string | undefined,
    req.query.to as string | undefined,
  );
  res.json({ success: true, data });
});

// Reports
export const financialSummaryHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getFinancialSummary();
  res.json({ success: true, data });
});

export const trialBalanceHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getTrialBalance(req.query.asOfDate as string | undefined);
  res.json({ success: true, data });
});

export const profitLossHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getProfitAndLoss(
    req.query.from as string | undefined,
    req.query.to as string | undefined,
  );
  res.json({ success: true, data });
});

export const balanceSheetHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getBalanceSheet(req.query.asOfDate as string | undefined);
  res.json({ success: true, data });
});

export const reconciliationHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getBankReconciliation();
  res.json({ success: true, data });
});

export const matchTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.matchBankTransaction(req.params.id, req.body.voucherId);
  res.json({ success: true, data });
});

export const excludeTransactionHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.excludeBankTransaction(req.params.id);
  res.json({ success: true, data });
});

export const projectionsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getProjections();
  res.json({ success: true, data });
});

// Legacy endpoints for backward compat
export const revenueHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getRevenueEntries();
  res.json({ success: true, data });
});

export const expensesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getExpenseEntries();
  res.json({ success: true, data });
});
