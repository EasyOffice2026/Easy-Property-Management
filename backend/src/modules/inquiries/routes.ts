import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  createInquiryHandler,
  deleteInquiryHandler,
  listInquiriesHandler,
  updateInquiryHandler,
} from './controller';

const WRITE_ROLES = [Role.SUPER_ADMIN, Role.PROPERTY_MANAGER, Role.LEASING_AGENT];

const router = Router();

router.get('/', requireAuth, listInquiriesHandler);
router.post('/', requireAuth, requireRole(...WRITE_ROLES), createInquiryHandler);
router.put('/:id', requireAuth, requireRole(...WRITE_ROLES), updateInquiryHandler);
router.delete('/:id', requireAuth, requireRole(...WRITE_ROLES), deleteInquiryHandler);

export default router;
