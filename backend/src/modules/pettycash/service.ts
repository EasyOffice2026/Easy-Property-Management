import {
  PettyCashCategory,
  PettyCashStatus,
  PettyCashTransactionType,
  Prisma,
} from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/AppError';

const MONTHLY_LIMIT = Number(process.env.PETTY_CASH_MONTHLY_LIMIT ?? 1000);

interface ListParams {
  buildingId?: string;
  type?: PettyCashTransactionType;
  category?: PettyCashCategory;
  status?: PettyCashStatus;
  month?: string; // YYYY-MM
  page: number;
  pageSize: number;
}

function monthRange(month?: string) {
  const date = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

export async function listTransactions(params: ListParams) {
  const { start, end } = monthRange(params.month);
  const where: Prisma.PettyCashTransactionWhereInput = {
    ...(params.buildingId ? { buildingId: params.buildingId } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.status ? { status: params.status } : {}),
    occurredAt: { gte: start, lt: end },
  };

  const [items, total] = await Promise.all([
    prisma.pettyCashTransaction.findMany({
      where,
      include: { building: true },
      orderBy: { occurredAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.pettyCashTransaction.count({ where }),
  ]);

  return { items, total, page: params.page, pageSize: params.pageSize };
}

export async function getMonthlySummary(month?: string) {
  const { start, end } = monthRange(month);
  const transactions = await prisma.pettyCashTransaction.findMany({
    where: { occurredAt: { gte: start, lt: end }, status: PettyCashStatus.APPROVED },
  });

  const replenished = transactions
    .filter((t) => t.type === PettyCashTransactionType.REPLENISHMENT)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const spent = transactions
    .filter((t) => t.type === PettyCashTransactionType.EXPENSE)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    monthlyLimit: MONTHLY_LIMIT,
    replenished,
    spent,
    remaining: MONTHLY_LIMIT + replenished - spent,
  };
}

interface CreateTransactionInput {
  buildingId?: string;
  type: PettyCashTransactionType;
  category: PettyCashCategory;
  amount: number;
  description: string;
  receiptUrl?: string;
  requestedBy: string;
  occurredAt?: Date;
}

export async function createTransaction(data: CreateTransactionInput) {
  if (data.type === PettyCashTransactionType.EXPENSE) {
    const summary = await getMonthlySummary();
    if (data.amount > summary.remaining) {
      throw new AppError(
        422,
        'PETTY_CASH_LIMIT_EXCEEDED',
        `Expense exceeds remaining petty cash balance (${summary.remaining} available)`
      );
    }
  }
  return prisma.pettyCashTransaction.create({ data });
}

export async function getTransaction(id: string) {
  const tx = await prisma.pettyCashTransaction.findUnique({ where: { id }, include: { building: true } });
  if (!tx) throw new AppError(404, 'PETTY_CASH_TRANSACTION_NOT_FOUND', 'Transaction not found');
  return tx;
}

export async function approveTransaction(id: string, approvedBy: string, status: PettyCashStatus) {
  await getTransaction(id);
  return prisma.pettyCashTransaction.update({ where: { id }, data: { status, approvedBy } });
}
