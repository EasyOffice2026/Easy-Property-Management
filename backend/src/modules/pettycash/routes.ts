import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  approveTransactionHandler,
  createTransactionHandler,
  listTransactionsHandler,
  monthlySummaryHandler,
} from './controller';

const WRITE_ROLES = [Role.SUPER_ADMIN, Role.PROPERTY_MANAGER, Role.ACCOUNTANT];
const APPROVE_ROLES = [Role.SUPER_ADMIN, Role.PROPERTY_MANAGER];

const router = Router();

router.get('/summary', requireAuth, monthlySummaryHandler);
router.get('/', requireAuth, listTransactionsHandler);
router.post('/', requireAuth, requireRole(...WRITE_ROLES), createTransactionHandler);
router.put('/:id/status', requireAuth, requireRole(...APPROVE_ROLES), approveTransactionHandler);

export default router;
