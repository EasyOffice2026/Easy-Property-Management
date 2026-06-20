import { prisma } from '../config/db';

export async function generateContractNumber(): Promise<string> {
  const prefix = process.env.CONTRACT_NUMBER_PREFIX ?? 'EPM';
  const year = new Date().getFullYear();
  const count = await prisma.contract.count({
    where: { contractNumber: { startsWith: `${prefix}-${year}-` } },
  });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}-${year}-${seq}`;
}
