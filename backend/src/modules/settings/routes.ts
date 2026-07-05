import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { getSettingsHandler, updateSettingsHandler } from './controller';

const router = Router();

router.get('/', requireAuth, getSettingsHandler);
router.put('/', requireAuth, requireRole(Role.SUPER_ADMIN), updateSettingsHandler);

export default router;
