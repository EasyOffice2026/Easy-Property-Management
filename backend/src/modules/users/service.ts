import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/AppError';

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, language: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createUser(data: { name: string; email: string; password: string; role: Prisma.UserCreateInput['role'] }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'EMAIL_TAKEN', 'A user with this email already exists');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role },
  });
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  const updated = await prisma.user.update({ where: { id }, data });
  return { id: updated.id, name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive };
}
