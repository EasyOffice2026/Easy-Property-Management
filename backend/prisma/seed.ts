import { PrismaClient, UnitType, UnitStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@epm.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@epm.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const building = await prisma.building.create({
    data: {
      nameEn: 'Salmiya Tower',
      nameAr: 'برج السالمية',
      address: 'Salmiya, Block 4, Street 12',
      totalFloors: 5,
      facilities: ['gym', 'parking', 'security', 'elevator'],
      units: {
        create: [
          { unitNumber: '101', floor: 1, type: UnitType.STUDIO, status: UnitStatus.AVAILABLE, rentAmount: 250 },
          { unitNumber: '102', floor: 1, type: UnitType.ONE_BED, status: UnitStatus.AVAILABLE, rentAmount: 350 },
          { unitNumber: '201', floor: 2, type: UnitType.TWO_BED, status: UnitStatus.OCCUPIED, rentAmount: 450 },
          { unitNumber: '202', floor: 2, type: UnitType.TWO_BED, status: UnitStatus.MAINTENANCE, rentAmount: 450 },
          { unitNumber: '301', floor: 3, type: UnitType.PENTHOUSE, status: UnitStatus.AVAILABLE, rentAmount: 900 },
        ],
      },
    },
  });

  console.log('Seed complete. Building created:', building.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
