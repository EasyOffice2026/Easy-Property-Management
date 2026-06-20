import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import * as authService from './service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password);
  res.json({ success: true, data: result });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const result = await authService.refresh(refreshToken);
  res.json({ success: true, data: result });
});

export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: null });
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const me = await authService.getMe(req.user!.id);
  res.json({ success: true, data: me });
});
