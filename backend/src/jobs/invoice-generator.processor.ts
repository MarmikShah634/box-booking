import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_INVOICE } from './queues.module';

export interface InvoiceJobData {
  bookingId: string;
  ownerId: string;
}

const GST_RATE = 0.18; // 18% GST (9% CGST + 9% SGST)

@Processor(QUEUE_INVOICE)
export class InvoiceGeneratorProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceGeneratorProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<InvoiceJobData>): Promise<void> {
    const { bookingId, ownerId } = job.data;

    const existing = await this.prisma.invoice.findUnique({ where: { bookingId } });
    if (existing) {
      this.logger.log(`Invoice already exists for booking ${bookingId}`);
      return;
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found for invoice generation`);
      return;
    }

    // Increment invoice sequence atomically
    const owner = await this.prisma.owner.update({
      where: { id: ownerId },
      data: { lastInvoiceSeq: { increment: 1 } },
      select: { lastInvoiceSeq: true },
    });

    const seq = String(owner.lastInvoiceSeq).padStart(6, '0');
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${ownerId.slice(0, 6).toUpperCase()}-${year}-${seq}`;

    // Calculate GST (amount includes GST, so back-calculate taxable)
    const totalAmount = booking.totalAmount;
    const taxableAmount = Math.round(totalAmount / (1 + GST_RATE));
    const gstAmount = totalAmount - taxableAmount;
    const cgst = Math.round(gstAmount / 2);
    const sgst = gstAmount - cgst;

    const pdfR2Key = `invoice/${ownerId}/${bookingId}.pdf`; // Would be generated with PDF library

    await this.prisma.invoice.create({
      data: {
        bookingId,
        ownerId,
        invoiceNumber,
        pdfR2Key,
        cgst,
        sgst,
        taxableAmount,
        totalAmount,
      },
    });

    this.logger.log(`Invoice ${invoiceNumber} generated for booking ${bookingId}`);
  }
}
