import { Request, Response } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './service';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export const listUsersHandler = asyncHandler(async (_req: Request, res: Response) => {
  const users = await service.listUsers();
  res.json({ success: true, data: users });
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  const user = await service.createUser(data);
  res.status(201).json({ success: true, data: user });
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = updateUserSchema.parse(req.body);
  const user = await service.updateUser(req.params.id, data);
  res.json({ success: true, data: user });
});
