import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  assetsDueServiceHandler,
  createAssetHandler,
  createWorkOrderHandler,
  getWorkOrderHandler,
  listAssetsHandler,
  listWorkOrdersHandler,
  updateAssetHandler,
  updateWorkOrderHandler,
} from './controller';

const WO_WRITE_ROLES = [Role.SUPER_ADMIN, Role.PROPERTY_MANAGER, Role.MAINTENANCE_SUPERVISOR];

const router = Router();

router.get('/work-orders', requireAuth, listWorkOrdersHandler);
router.post('/work-orders', requireAuth, requireRole(...WO_WRITE_ROLES), createWorkOrderHandler);
router.get('/work-orders/:id', requireAuth, getWorkOrderHandler);
router.put('/work-orders/:id', requireAuth, requireRole(...WO_WRITE_ROLES), updateWorkOrderHandler);

router.get('/assets/due-service', requireAuth, assetsDueServiceHandler);
router.get('/assets', requireAuth, listAssetsHandler);
router.post('/assets', requireAuth, requireRole(...WO_WRITE_ROLES), createAssetHandler);
router.put('/assets/:id', requireAuth, requireRole(...WO_WRITE_ROLES), updateAssetHandler);

export default router;
