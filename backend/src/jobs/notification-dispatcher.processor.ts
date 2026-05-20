import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SmsService } from '../notifications/sms.service';
import { EmailService } from '../notifications/email.service';
import { QUEUE_NOTIFICATION } from './queues.module';

export type NotificationType =
  | 'booking_confirmed_user_sms'
  | 'booking_confirmed_user_email'
  | 'booking_cancelled_user_sms'
  | 'refund_initiated_user_sms'
  | 'owner_new_booking_email';

export interface NotificationJobData {
  type: NotificationType;
  recipient: string; // phone or email
  variables: Record<string, string>;
}

@Processor(QUEUE_NOTIFICATION)
export class NotificationDispatcherProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationDispatcherProcessor.name);

  constructor(
    private readonly sms: SmsService,
    private readonly email: EmailService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { type, recipient, variables } = job.data;

    try {
      switch (type) {
        case 'booking_confirmed_user_sms':
          await this.sms.sendBookingConfirmation(recipient, variables);
          break;
        case 'booking_confirmed_user_email':
          await this.email.sendBookingConfirmation(recipient, variables);
          break;
        case 'booking_cancelled_user_sms':
          await this.sms.sendBookingConfirmation(recipient, variables); // reuse template
          break;
        case 'refund_initiated_user_sms':
          await this.sms.sendRefundNotification(recipient, variables);
          break;
        case 'owner_new_booking_email':
          await this.email.sendGeneric(
            recipient,
            'New Booking - BoxCricket',
            `<p>You have a new booking. Details: ${JSON.stringify(variables)}</p>`,
          );
          break;
        default: {
          const exhaustive: never = type;
          this.logger.warn(`Unknown notification type: ${exhaustive as string}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to dispatch notification ${type} to ${recipient}`, err);
      throw err;
    }
  }
}
