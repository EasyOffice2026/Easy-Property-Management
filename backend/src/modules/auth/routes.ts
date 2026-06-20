import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { loginHandler, logoutHandler, meHandler, refreshHandler } from './controller';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', requireAuth, meHandler);

export default router;
