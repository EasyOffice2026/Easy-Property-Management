import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { createUserHandler, listUsersHandler, updateUserHandler } from './controller';

const router = Router();

router.get('/', requireAuth, requireRole(Role.SUPER_ADMIN), listUsersHandler);
router.post('/', requireAuth, requireRole(Role.SUPER_ADMIN), createUserHandler);
router.put('/:id', requireAuth, requireRole(Role.SUPER_ADMIN), updateUserHandler);

export default router;
