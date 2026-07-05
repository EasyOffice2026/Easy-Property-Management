import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// One-time cleanup: remove duplicate/orphan buildings that have no units.
// These were created by non-idempotent seed runs on earlier deploys.
async function main() {
  const buildings = await prisma.building.findMany({
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const withUnits = buildings.filter((b) => b._count.units > 0);
  const withoutUnits = buildings.filter((b) => b._count.units === 0);

  // Keep the first building that has units; if none have units, keep the oldest.
  const keepId = withUnits.length > 0 ? withUnits[0].id : buildings[0]?.id;

  const toDelete = buildings.filter((b) => b.id !== keepId && b._count.units === 0);

  for (const b of toDelete) {
    await prisma.building.delete({ where: { id: b.id } });
    console.log(`Deleted orphan building: ${b.nameEn} (${b.id})`);
  }

  console.log(
    `Cleanup done. Kept ${keepId}. Deleted ${toDelete.length} orphan buildings. ` +
      `(${withUnits.length} with units, ${withoutUnits.length} without units before cleanup)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
