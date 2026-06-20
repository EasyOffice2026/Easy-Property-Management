import { InquiryStatus, InquiryChannel, Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/AppError';

interface ListInquiriesParams {
  status?: InquiryStatus;
  channel?: InquiryChannel;
  page: number;
  pageSize: number;
}

export async function listInquiries(params: ListInquiriesParams) {
  const where: Prisma.InquiryWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.channel ? { channel: params.channel } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.inquiry.count({ where }),
  ]);

  return { items, total, page: params.page, pageSize: params.pageSize };
}

export async function createInquiry(data: Prisma.InquiryCreateInput) {
  return prisma.inquiry.create({ data });
}

export async function getInquiry(id: string) {
  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) throw new AppError(404, 'INQUIRY_NOT_FOUND', 'Inquiry not found');
  return inquiry;
}

export async function updateInquiry(id: string, data: Prisma.InquiryUpdateInput) {
  await getInquiry(id);
  return prisma.inquiry.update({ where: { id }, data });
}

export async function deleteInquiry(id: string) {
  await getInquiry(id);
  return prisma.inquiry.update({ where: { id }, data: { status: InquiryStatus.LOST } });
}
