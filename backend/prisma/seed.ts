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
  AccountType,
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

  const existingBuildings = await prisma.building.count();
  if (existingBuildings > 0) {
    console.log('Seed data already present, skipping demo data seeding.');
    return;
  }

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

  // ========================
  // Chart of Accounts
  // ========================
  const accounts: { code: string; nameEn: string; nameAr: string; type: AccountType; parentCode?: string }[] = [
    // ASSETS
    { code: '1000', nameEn: 'Assets', nameAr: 'الأصول', type: AccountType.ASSET },
    { code: '1100', nameEn: 'Cash & Bank', nameAr: 'النقد والبنك', type: AccountType.ASSET, parentCode: '1000' },
    { code: '1110', nameEn: 'Cash on Hand', nameAr: 'النقد في الصندوق', type: AccountType.ASSET, parentCode: '1100' },
    { code: '1120', nameEn: 'Bank Account - NBK', nameAr: 'حساب البنك - الوطني', type: AccountType.ASSET, parentCode: '1100' },
    { code: '1130', nameEn: 'Petty Cash', nameAr: 'المصروفات النثرية', type: AccountType.ASSET, parentCode: '1100' },
    { code: '1200', nameEn: 'Accounts Receivable', nameAr: 'الذمم المدينة', type: AccountType.ASSET, parentCode: '1000' },
    { code: '1210', nameEn: 'Tenant Receivables', nameAr: 'ذمم المستأجرين', type: AccountType.ASSET, parentCode: '1200' },
    { code: '1300', nameEn: 'Security Deposits Paid', nameAr: 'التأمينات المدفوعة', type: AccountType.ASSET, parentCode: '1000' },
    { code: '1400', nameEn: 'Fixed Assets', nameAr: 'الأصول الثابتة', type: AccountType.ASSET, parentCode: '1000' },
    { code: '1410', nameEn: 'Property & Buildings', nameAr: 'العقارات والمباني', type: AccountType.ASSET, parentCode: '1400' },
    { code: '1420', nameEn: 'Furniture & Equipment', nameAr: 'الأثاث والمعدات', type: AccountType.ASSET, parentCode: '1400' },
    { code: '1430', nameEn: 'Accumulated Depreciation', nameAr: 'الاستهلاك المتراكم', type: AccountType.ASSET, parentCode: '1400' },
    // LIABILITIES
    { code: '2000', nameEn: 'Liabilities', nameAr: 'الالتزامات', type: AccountType.LIABILITY },
    { code: '2100', nameEn: 'Accounts Payable', nameAr: 'الذمم الدائنة', type: AccountType.LIABILITY, parentCode: '2000' },
    { code: '2200', nameEn: 'Security Deposits Held', nameAr: 'التأمينات المحتجزة', type: AccountType.LIABILITY, parentCode: '2000' },
    { code: '2300', nameEn: 'Advance Rents', nameAr: 'الإيجارات المقدمة', type: AccountType.LIABILITY, parentCode: '2000' },
    { code: '2400', nameEn: 'Loans Payable', nameAr: 'القروض المستحقة', type: AccountType.LIABILITY, parentCode: '2000' },
    { code: '2500', nameEn: 'Accrued Expenses', nameAr: 'المصروفات المستحقة', type: AccountType.LIABILITY, parentCode: '2000' },
    // EQUITY
    { code: '3000', nameEn: 'Equity', nameAr: 'حقوق الملكية', type: AccountType.EQUITY },
    { code: '3100', nameEn: "Owner's Equity", nameAr: 'رأس المال', type: AccountType.EQUITY, parentCode: '3000' },
    { code: '3200', nameEn: 'Retained Earnings', nameAr: 'الأرباح المحتجزة', type: AccountType.EQUITY, parentCode: '3000' },
    // REVENUE
    { code: '4000', nameEn: 'Revenue', nameAr: 'الإيرادات', type: AccountType.REVENUE },
    { code: '4100', nameEn: 'Rental Income', nameAr: 'إيرادات الإيجار', type: AccountType.REVENUE, parentCode: '4000' },
    { code: '4200', nameEn: 'Late Fee Income', nameAr: 'إيرادات رسوم التأخير', type: AccountType.REVENUE, parentCode: '4000' },
    { code: '4300', nameEn: 'Other Income', nameAr: 'إيرادات أخرى', type: AccountType.REVENUE, parentCode: '4000' },
    // EXPENSES
    { code: '5000', nameEn: 'Expenses', nameAr: 'المصروفات', type: AccountType.EXPENSE },
    { code: '5100', nameEn: 'Maintenance Expenses', nameAr: 'مصروفات الصيانة', type: AccountType.EXPENSE, parentCode: '5000' },
    { code: '5200', nameEn: 'Utilities', nameAr: 'المرافق', type: AccountType.EXPENSE, parentCode: '5000' },
    { code: '5300', nameEn: 'Insurance', nameAr: 'التأمين', type: AccountType.EXPENSE, parentCode: '5000' },
    { code: '5400', nameEn: 'Management Fees', nameAr: 'رسوم الإدارة', type: AccountType.EXPENSE, parentCode: '5000' },
    { code: '5500', nameEn: 'Depreciation', nameAr: 'الاستهلاك', type: AccountType.EXPENSE, parentCode: '5000' },
    { code: '5600', nameEn: 'Office Supplies', nameAr: 'مستلزمات المكتب', type: AccountType.EXPENSE, parentCode: '5000' },
    { code: '5700', nameEn: 'Transport', nameAr: 'النقل', type: AccountType.EXPENSE, parentCode: '5000' },
    { code: '5800', nameEn: 'Cleaning Expenses', nameAr: 'مصروفات التنظيف', type: AccountType.EXPENSE, parentCode: '5000' },
    { code: '5900', nameEn: 'Miscellaneous Expenses', nameAr: 'مصروفات متنوعة', type: AccountType.EXPENSE, parentCode: '5000' },
  ];

  // Create accounts (parents first, then children)
  const accountMap = new Map<string, string>();
  for (const acc of accounts) {
    const created = await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        nameEn: acc.nameEn,
        nameAr: acc.nameAr,
        type: acc.type,
        parentId: acc.parentCode ? accountMap.get(acc.parentCode) : null,
      },
    });
    accountMap.set(acc.code, created.id);
  }

  // Create sample journal entries and vouchers
  const admin = await prisma.user.findUnique({ where: { email: 'admin@epm.com' } });
  if (admin) {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');

    // Receipt Voucher - Rent from Ahmed Al-Sabah
    const rv1 = await prisma.voucher.create({
      data: {
        voucherNumber: `RV-${yr}-001`,
        type: 'RECEIPT',
        date: new Date(`${yr}-${mo}-01`),
        partyName: 'Ahmed Al-Sabah',
        description: 'Monthly rent - Unit 101',
        amount: 250,
        paymentMethod: 'Bank Transfer',
        referenceNo: 'TRN-001',
        status: 'APPROVED',
        createdById: admin.id,
      },
    });

    const je1 = await prisma.journalEntry.create({
      data: {
        entryNumber: `JE-${yr}-001`,
        date: new Date(`${yr}-${mo}-01`),
        description: 'Rent received - Ahmed Al-Sabah, Unit 101',
        reference: rv1.voucherNumber,
        status: 'POSTED',
        totalAmount: 250,
        createdById: admin.id,
        lines: {
          create: [
            { accountId: accountMap.get('1120')!, debit: 250, credit: 0, description: 'Bank deposit' },
            { accountId: accountMap.get('4100')!, debit: 0, credit: 250, description: 'Rental income' },
          ],
        },
      },
    });

    await prisma.voucher.update({
      where: { id: rv1.id },
      data: { journalEntryId: je1.id },
    });

    // Receipt Voucher - Rent from Sara Khan
    const rv2 = await prisma.voucher.create({
      data: {
        voucherNumber: `RV-${yr}-002`,
        type: 'RECEIPT',
        date: new Date(`${yr}-${mo}-03`),
        partyName: 'Sara Khan',
        description: 'Monthly rent - Unit 102',
        amount: 350,
        paymentMethod: 'Bank Transfer',
        referenceNo: 'TRN-002',
        status: 'APPROVED',
        createdById: admin.id,
      },
    });

    const je2 = await prisma.journalEntry.create({
      data: {
        entryNumber: `JE-${yr}-002`,
        date: new Date(`${yr}-${mo}-03`),
        description: 'Rent received - Sara Khan, Unit 102',
        reference: rv2.voucherNumber,
        status: 'POSTED',
        totalAmount: 350,
        createdById: admin.id,
        lines: {
          create: [
            { accountId: accountMap.get('1120')!, debit: 350, credit: 0, description: 'Bank deposit' },
            { accountId: accountMap.get('4100')!, debit: 0, credit: 350, description: 'Rental income' },
          ],
        },
      },
    });

    await prisma.voucher.update({
      where: { id: rv2.id },
      data: { journalEntryId: je2.id },
    });

    // Receipt Voucher - Rent from Gulf Trading
    const rv3 = await prisma.voucher.create({
      data: {
        voucherNumber: `RV-${yr}-003`,
        type: 'RECEIPT',
        date: new Date(`${yr}-${mo}-05`),
        partyName: 'Gulf Trading Co.',
        description: 'Monthly rent - Unit 201',
        amount: 450,
        paymentMethod: 'Bank Transfer',
        referenceNo: 'TRN-003',
        status: 'APPROVED',
        createdById: admin.id,
      },
    });

    const je3 = await prisma.journalEntry.create({
      data: {
        entryNumber: `JE-${yr}-003`,
        date: new Date(`${yr}-${mo}-05`),
        description: 'Rent received - Gulf Trading Co., Unit 201',
        reference: rv3.voucherNumber,
        status: 'POSTED',
        totalAmount: 450,
        createdById: admin.id,
        lines: {
          create: [
            { accountId: accountMap.get('1120')!, debit: 450, credit: 0, description: 'Bank deposit' },
            { accountId: accountMap.get('4100')!, debit: 0, credit: 450, description: 'Rental income' },
          ],
        },
      },
    });

    await prisma.voucher.update({
      where: { id: rv3.id },
      data: { journalEntryId: je3.id },
    });

    // Payment Voucher - Maintenance
    const pv1 = await prisma.voucher.create({
      data: {
        voucherNumber: `PV-${yr}-001`,
        type: 'PAYMENT',
        date: new Date(`${yr}-${mo}-10`),
        partyName: 'Al-Faisal Maintenance Co.',
        description: 'Plumbing repair - Unit 202',
        amount: 120,
        paymentMethod: 'Cash',
        status: 'APPROVED',
        createdById: admin.id,
      },
    });

    const je4 = await prisma.journalEntry.create({
      data: {
        entryNumber: `JE-${yr}-004`,
        date: new Date(`${yr}-${mo}-10`),
        description: 'Maintenance expense - Plumbing repair, Unit 202',
        reference: pv1.voucherNumber,
        status: 'POSTED',
        totalAmount: 120,
        createdById: admin.id,
        lines: {
          create: [
            { accountId: accountMap.get('5100')!, debit: 120, credit: 0, description: 'Maintenance expense' },
            { accountId: accountMap.get('1110')!, debit: 0, credit: 120, description: 'Cash payment' },
          ],
        },
      },
    });

    await prisma.voucher.update({
      where: { id: pv1.id },
      data: { journalEntryId: je4.id },
    });

    // Payment Voucher - Utilities
    const pv2 = await prisma.voucher.create({
      data: {
        voucherNumber: `PV-${yr}-002`,
        type: 'PAYMENT',
        date: new Date(`${yr}-${mo}-15`),
        partyName: 'Ministry of Electricity',
        description: 'Electricity bill - Salmiya Tower',
        amount: 380,
        paymentMethod: 'Bank Transfer',
        referenceNo: 'ELEC-2026-06',
        status: 'APPROVED',
        createdById: admin.id,
      },
    });

    const je5 = await prisma.journalEntry.create({
      data: {
        entryNumber: `JE-${yr}-005`,
        date: new Date(`${yr}-${mo}-15`),
        description: 'Electricity expense - Salmiya Tower',
        reference: pv2.voucherNumber,
        status: 'POSTED',
        totalAmount: 380,
        createdById: admin.id,
        lines: {
          create: [
            { accountId: accountMap.get('5200')!, debit: 380, credit: 0, description: 'Utilities expense' },
            { accountId: accountMap.get('1120')!, debit: 0, credit: 380, description: 'Bank payment' },
          ],
        },
      },
    });

    await prisma.voucher.update({
      where: { id: pv2.id },
      data: { journalEntryId: je5.id },
    });

    // Bank transactions for reconciliation
    await prisma.bankTransaction.createMany({
      data: [
        { date: new Date(`${yr}-${mo}-01`), description: 'TRF IN - Ahmed Al-Sabah', reference: 'TRN-001', debit: 0, credit: 250, balance: 85650, status: 'MATCHED', matchedVoucherId: rv1.id, importBatch: 'IMPORT-001' },
        { date: new Date(`${yr}-${mo}-03`), description: 'TRF IN - Sara Khan', reference: 'TRN-002', debit: 0, credit: 350, balance: 86000, status: 'MATCHED', matchedVoucherId: rv2.id, importBatch: 'IMPORT-001' },
        { date: new Date(`${yr}-${mo}-05`), description: 'TRF IN - Gulf Trading Co.', reference: 'TRN-003', debit: 0, credit: 450, balance: 86450, status: 'MATCHED', matchedVoucherId: rv3.id, importBatch: 'IMPORT-001' },
        { date: new Date(`${yr}-${mo}-15`), description: 'TRF OUT - Min. of Electricity', reference: 'ELEC-2026-06', debit: 380, credit: 0, balance: 86070, status: 'MATCHED', matchedVoucherId: pv2.id, importBatch: 'IMPORT-001' },
        { date: new Date(`${yr}-${mo}-20`), description: 'ATM Withdrawal', debit: 200, credit: 0, balance: 85870, status: 'UNMATCHED', importBatch: 'IMPORT-001' },
        { date: new Date(`${yr}-${mo}-22`), description: 'Bank Fee', debit: 5, credit: 0, balance: 85865, status: 'UNMATCHED', importBatch: 'IMPORT-001' },
      ],
    });
  }

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
