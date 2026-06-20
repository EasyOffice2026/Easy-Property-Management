import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  createBuildingHandler,
  createUnitHandler,
  getBuildingHandler,
  listAvailableUnitsHandler,
  listBuildingsHandler,
  listUnitsByBuildingHandler,
  updateBuildingHandler,
  updateUnitHandler,
} from './controller';

const MANAGER_ROLES = [Role.SUPER_ADMIN, Role.PROPERTY_MANAGER];

const router = Router();

router.get('/buildings', requireAuth, listBuildingsHandler);
router.post('/buildings', requireAuth, requireRole(...MANAGER_ROLES), createBuildingHandler);
router.get('/buildings/:id', requireAuth, getBuildingHandler);
router.put('/buildings/:id', requireAuth, requireRole(...MANAGER_ROLES), updateBuildingHandler);
router.get('/buildings/:id/units', requireAuth, listUnitsByBuildingHandler);

router.get('/units/available', requireAuth, listAvailableUnitsHandler);
router.post('/units', requireAuth, requireRole(...MANAGER_ROLES), createUnitHandler);
router.put('/units/:id', requireAuth, requireRole(...MANAGER_ROLES), updateUnitHandler);

export default router;
