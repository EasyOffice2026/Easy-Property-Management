import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { documentUpload } from '../../utils/fileStorage';
import {
  createTenantHandler,
  getTenantHandler,
  listTenantsHandler,
  updateTenantHandler,
  uploadTenantDocumentHandler,
} from './controller';

const WRITE_ROLES = [Role.SUPER_ADMIN, Role.PROPERTY_MANAGER, Role.LEASING_AGENT];

const router = Router();

router.get('/', requireAuth, listTenantsHandler);
router.post('/', requireAuth, requireRole(...WRITE_ROLES), createTenantHandler);
router.get('/:id', requireAuth, getTenantHandler);
router.put('/:id', requireAuth, requireRole(...WRITE_ROLES), updateTenantHandler);
router.post(
  '/:id/documents',
  requireAuth,
  requireRole(...WRITE_ROLES),
  documentUpload.single('file'),
  uploadTenantDocumentHandler
);

export default router;
