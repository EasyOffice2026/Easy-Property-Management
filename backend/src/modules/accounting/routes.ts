import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  accountTreeHandler,
  accountByIdHandler,
  createAccountHandler,
  updateAccountHandler,
  journalEntriesHandler,
  journalEntryByIdHandler,
  createJournalEntryHandler,
  postJournalEntryHandler,
  voidJournalEntryHandler,
  vouchersHandler,
  voucherByIdHandler,
  createVoucherHandler,
  approveVoucherHandler,
  voidVoucherHandler,
  ledgerHandler,
  financialSummaryHandler,
  trialBalanceHandler,
  profitLossHandler,
  balanceSheetHandler,
  reconciliationHandler,
  matchTransactionHandler,
  excludeTransactionHandler,
  projectionsHandler,
  revenueHandler,
  expensesHandler,
} from './controller';

const router = Router();

// Chart of Accounts
router.get('/accounts', requireAuth, accountTreeHandler);
router.get('/accounts/:id', requireAuth, accountByIdHandler);
router.post('/accounts', requireAuth, createAccountHandler);
router.put('/accounts/:id', requireAuth, updateAccountHandler);

// Journal Entries
router.get('/journals', requireAuth, journalEntriesHandler);
router.get('/journals/:id', requireAuth, journalEntryByIdHandler);
router.post('/journals', requireAuth, createJournalEntryHandler);
router.patch('/journals/:id/post', requireAuth, postJournalEntryHandler);
router.patch('/journals/:id/void', requireAuth, voidJournalEntryHandler);

// Vouchers
router.get('/vouchers', requireAuth, vouchersHandler);
router.get('/vouchers/:id', requireAuth, voucherByIdHandler);
router.post('/vouchers', requireAuth, createVoucherHandler);
router.patch('/vouchers/:id/approve', requireAuth, approveVoucherHandler);
router.patch('/vouchers/:id/void', requireAuth, voidVoucherHandler);

// Ledger
router.get('/ledger/:accountId', requireAuth, ledgerHandler);

// Reports
router.get('/summary', requireAuth, financialSummaryHandler);
router.get('/trial-balance', requireAuth, trialBalanceHandler);
router.get('/profit-loss', requireAuth, profitLossHandler);
router.get('/balance-sheet', requireAuth, balanceSheetHandler);
router.get('/reconciliation', requireAuth, reconciliationHandler);
router.patch('/reconciliation/:id/match', requireAuth, matchTransactionHandler);
router.patch('/reconciliation/:id/exclude', requireAuth, excludeTransactionHandler);
router.get('/projections', requireAuth, projectionsHandler);

// Legacy
router.get('/revenue', requireAuth, revenueHandler);
router.get('/expenses', requireAuth, expensesHandler);

export default router;
