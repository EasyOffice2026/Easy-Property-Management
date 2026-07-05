import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// One-time reset: earlier non-idempotent seed runs created duplicate demo data
// (buildings, units, tenants). This wipes all demo data (keeping users) so the
// idempotent seed can repopulate a single clean set. Guarded by RUN_RESET so it
// only executes when explicitly enabled.
async function main() {
  if (process.env.RUN_RESET !== 'true') {
    console.log('RUN_RESET not set, skipping reset.');
    return;
  }

  await prisma.journalEntryLine.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.voucher.deleteMany({});
  await prisma.bankTransaction.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.pettyCashTransaction.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.inquiry.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.building.deleteMany({});

  console.log('Reset complete: all demo data cleared (users preserved).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
