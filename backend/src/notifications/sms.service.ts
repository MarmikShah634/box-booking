import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly authKey: string;
  private readonly senderId: string;
  private readonly otpTemplateId: string;
  private readonly bookingTemplateId: string;
  private readonly refundTemplateId: string;
  private readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    this.authKey = this.config.get<string>('MSG91_AUTH_KEY') ?? '';
    this.senderId = this.config.get<string>('MSG91_SENDER_ID') ?? '';
    this.otpTemplateId = this.config.get<string>('MSG91_OTP_TEMPLATE_ID') ?? '';
    this.bookingTemplateId = this.config.get<string>('MSG91_BOOKING_CONFIRM_TEMPLATE_ID') ?? '';
    this.refundTemplateId = this.config.get<string>('MSG91_REFUND_TEMPLATE_ID') ?? '';
    this.isConfigured = Boolean(this.authKey && this.senderId);
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`[STUB] SMS OTP to ${phone}: ${otp}`);
      return;
    }
    try {
      await axios.post(
        'https://api.msg91.com/api/v5/otp',
        {
          template_id: this.otpTemplateId,
          mobile: phone.replace('+', ''),
          authkey: this.authKey,
          otp,
        },
      );
    } catch (err) {
      this.logger.error(`Failed to send OTP SMS to ${phone}`, err);
    }
  }

  async sendBookingConfirmation(phone: string, variables: Record<string, string>): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`[STUB] Booking confirmation SMS to ${phone}`, variables);
      return;
    }
    try {
      await this.sendTemplate(phone, this.bookingTemplateId, variables);
    } catch (err) {
      this.logger.error(`Failed to send booking confirmation SMS to ${phone}`, err);
    }
  }

  async sendRefundNotification(phone: string, variables: Record<string, string>): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`[STUB] Refund SMS to ${phone}`, variables);
      return;
    }
    try {
      await this.sendTemplate(phone, this.refundTemplateId, variables);
    } catch (err) {
      this.logger.error(`Failed to send refund SMS to ${phone}`, err);
    }
  }

  private async sendTemplate(phone: string, templateId: string, variables: Record<string, string>): Promise<void> {
    await axios.post('https://api.msg91.com/api/v5/flow/', {
      template_id: templateId,
      sender: this.senderId,
      mobiles: phone.replace('+', ''),
      authkey: this.authKey,
      ...variables,
    });
  }
}
