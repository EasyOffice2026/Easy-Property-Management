import {
  PrismaClient,
  UnitType,
  UnitStatus,
  TenantType,
  RentPeriod,
  ContractStatus,
  Trade,
  Priority,
  WOStatus,
  AssetStatus,
} from '@prisma/client';
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

  const maintenanceUnit = units.find((u) => u.unitNumber === '202')!;
  const year = new Date().getFullYear();
  await Promise.all(
    [
      {
        woNumber: `WO-${year}-001`,
        unitId: maintenanceUnit.id,
        buildingId: building.id,
        trade: Trade.PLUMBING,
        priority: Priority.EMERGENCY,
        description: 'Leaking pipe under kitchen sink',
        status: WOStatus.IN_PROGRESS,
      },
      {
        woNumber: `WO-${year}-002`,
        unitId: units[0].id,
        buildingId: building.id,
        trade: Trade.ELECTRICAL,
        priority: Priority.HIGH,
        description: 'Power outlet not working in bedroom',
        status: WOStatus.PENDING,
      },
      {
        woNumber: `WO-${year}-003`,
        unitId: units[1].id,
        buildingId: building.id,
        trade: Trade.CARPENTRY,
        priority: Priority.ROUTINE,
        description: 'Wardrobe door hinge replacement',
        status: WOStatus.ASSIGNED,
      },
      {
        woNumber: `WO-${year}-004`,
        buildingId: building.id,
        trade: Trade.CLEANING,
        priority: Priority.ROUTINE,
        description: 'Common area deep cleaning',
        status: WOStatus.COMPLETED,
        completedAt: new Date(),
      },
      {
        woNumber: `WO-${year}-005`,
        unitId: units[4].id,
        buildingId: building.id,
        trade: Trade.MASONRY,
        priority: Priority.HIGH,
        description: 'Crack in balcony wall',
        status: WOStatus.PENDING,
      },
    ].map((data) => prisma.workOrder.create({ data }))
  );

  await Promise.all([
    prisma.asset.create({
      data: {
        buildingId: building.id,
        name: 'Main Elevator',
        category: Trade.OTHER,
        location: 'Common Area',
        purchaseDate: new Date('2020-01-15'),
        warrantyExpiry: new Date('2025-01-15'),
        nextServiceDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: AssetStatus.GOOD,
      },
    }),
    prisma.asset.create({
      data: {
        buildingId: building.id,
        name: 'Generator',
        category: Trade.ELECTRICAL,
        location: 'Common Area',
        purchaseDate: new Date('2019-06-01'),
        nextServiceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: AssetStatus.GOOD,
      },
    }),
  ]);

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
