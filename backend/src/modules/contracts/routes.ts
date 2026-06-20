import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  clearContractHandler,
  contractPdfHandler,
  createContractHandler,
  expiringContractsHandler,
  getContractHandler,
  listContractsHandler,
  renewContractHandler,
  signContractHandler,
  terminateContractHandler,
} from './controller';

const CREATE_ROLES = [Role.SUPER_ADMIN, Role.PROPERTY_MANAGER, Role.LEASING_AGENT];
const SIGN_ROLES = [Role.SUPER_ADMIN, Role.PROPERTY_MANAGER, Role.LEASING_AGENT];
const CLEAR_ROLES = [Role.SUPER_ADMIN, Role.PROPERTY_MANAGER];

const router = Router();

router.get('/expiring', requireAuth, expiringContractsHandler);
router.get('/', requireAuth, listContractsHandler);
router.post('/', requireAuth, requireRole(...CREATE_ROLES), createContractHandler);
router.get('/:id', requireAuth, getContractHandler);
router.get('/:id/pdf', requireAuth, contractPdfHandler);
router.post('/:id/sign', requireAuth, requireRole(...SIGN_ROLES), signContractHandler);
router.post('/:id/clear', requireAuth, requireRole(...CLEAR_ROLES), clearContractHandler);
router.post('/:id/terminate', requireAuth, requireRole(...CLEAR_ROLES), terminateContractHandler);
router.post('/:id/renew', requireAuth, requireRole(...CREATE_ROLES), renewContractHandler);

export default router;
