import { PrismaClient, UnitType, UnitStatus, TenantType, RentPeriod, ContractStatus } from '@prisma/client';
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

  const tenants = await Promise.all(
    [
      {
        tenantType: TenantType.INDIVIDUAL,
        firstName: 'Ahmed',
        lastName: 'Al-Sabah',
        nationality: 'Kuwaiti',
        email: 'ahmed.alsabah@example.com',
        mobile: '+96550001111',
        civilId: '289010100123',
      },
      {
        tenantType: TenantType.INDIVIDUAL,
        firstName: 'Sara',
        lastName: 'Khan',
        nationality: 'Pakistani',
        email: 'sara.khan@example.com',
        mobile: '+96550002222',
        passportNumber: 'PK1234567',
      },
      {
        tenantType: TenantType.COMPANY,
        companyName: 'Gulf Trading Co.',
        nationality: 'Kuwaiti',
        email: 'admin@gulftrading.com',
        mobile: '+96550003333',
      },
      {
        tenantType: TenantType.INDIVIDUAL,
        firstName: 'Mohammed',
        lastName: 'Hassan',
        nationality: 'Egyptian',
        email: 'mohammed.hassan@example.com',
        mobile: '+96550004444',
        civilId: '290020200456',
      },
      {
        tenantType: TenantType.COMPANY,
        companyName: 'Bayview Consulting',
        nationality: 'Kuwaiti',
        email: 'contact@bayviewconsulting.com',
        mobile: '+96550005555',
      },
    ].map((data) => prisma.tenant.create({ data }))
  );

  const units = await prisma.unit.findMany({ where: { buildingId: building.id }, orderBy: { unitNumber: 'asc' } });
  const occupiedUnits = units.filter((u) => u.unitNumber !== '202' && u.unitNumber !== '301');

  await Promise.all(
    occupiedUnits.map((unit, index) =>
      prisma.contract.create({
        data: {
          contractNumber: `EPM-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
          tenantId: tenants[index].id,
          unitId: unit.id,
          rentPeriod: RentPeriod.MONTHLY,
          rentAmount: unit.rentAmount,
          securityDeposit: unit.rentAmount,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: ContractStatus.ACTIVE,
          signedAt: new Date(),
        },
      })
    )
  );

  await prisma.unit.updateMany({
    where: { id: { in: occupiedUnits.map((u) => u.id) } },
    data: { status: UnitStatus.OCCUPIED },
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
