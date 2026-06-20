import PDFDocument from 'pdfkit';
import { Response } from 'express';

export function streamContractPdf(res: Response, contract: {
  contractNumber: string;
  rentPeriod: string;
  rentAmount: unknown;
  securityDeposit: unknown;
  startDate: Date;
  endDate: Date;
  status: string;
  tenant: { firstName: string | null; lastName: string | null; companyName: string | null; mobile: string; email: string };
  unit: { unitNumber: string; floor: number; building: { nameEn: string; address: string } };
}) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${contract.contractNumber}.pdf`);
  doc.pipe(res);

  const tenantName = contract.tenant.companyName ?? `${contract.tenant.firstName ?? ''} ${contract.tenant.lastName ?? ''}`.trim();

  doc.fontSize(18).text('Tenancy Contract', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Contract Number: ${contract.contractNumber}`);
  doc.text(`Status: ${contract.status}`);
  doc.moveDown();
  doc.text(`Tenant: ${tenantName}`);
  doc.text(`Mobile: ${contract.tenant.mobile}`);
  doc.text(`Email: ${contract.tenant.email}`);
  doc.moveDown();
  doc.text(`Building: ${contract.unit.building.nameEn}`);
  doc.text(`Address: ${contract.unit.building.address}`);
  doc.text(`Unit: ${contract.unit.unitNumber} (Floor ${contract.unit.floor})`);
  doc.moveDown();
  doc.text(`Rent Period: ${contract.rentPeriod}`);
  doc.text(`Rent Amount: ${contract.rentAmount} KWD`);
  doc.text(`Security Deposit: ${contract.securityDeposit} KWD`);
  doc.text(`Start Date: ${contract.startDate.toDateString()}`);
  doc.text(`End Date: ${contract.endDate.toDateString()}`);

  doc.end();
}
