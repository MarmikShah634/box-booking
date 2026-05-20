import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvoice(requesterId: string, requesterRole: 'user' | 'owner', invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: {
          select: {
            userId: true,
            ownerId: true,
            slotStartAt: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!invoice) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Invoice not found' });

    // Authorization check
    if (requesterRole === 'user' && invoice.booking.userId !== requesterId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your invoice' });
    }
    if (requesterRole === 'owner' && invoice.booking.ownerId !== requesterId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your invoice' });
    }

    // Return metadata (presigned URL generation would require R2Service)
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      taxableAmount: invoice.taxableAmount,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      totalAmount: invoice.totalAmount,
      pdfKey: invoice.pdfR2Key,
      // presignedUrl: would be generated here with R2 service
    };
  }
}
