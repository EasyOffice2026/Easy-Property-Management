import { prisma } from '../config/db';

export async function generateWoNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.workOrder.count({
    where: { woNumber: { startsWith: `WO-${year}-` } },
  });
  const seq = String(count + 1).padStart(3, '0');
  return `WO-${year}-${seq}`;
}
