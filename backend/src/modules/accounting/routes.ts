import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  balanceSheetHandler,
  cashFlowHandler,
  expensesHandler,
  financialSummaryHandler,
  profitLossHandler,
  projectionsHandler,
  revenueHandler,
} from './controller';

const router = Router();

router.get('/summary', requireAuth, financialSummaryHandler);
router.get('/revenue', requireAuth, revenueHandler);
router.get('/expenses', requireAuth, expensesHandler);
router.get('/profit-loss', requireAuth, profitLossHandler);
router.get('/balance-sheet', requireAuth, balanceSheetHandler);
router.get('/cash-flow', requireAuth, cashFlowHandler);
router.get('/projections', requireAuth, projectionsHandler);

export default router;
