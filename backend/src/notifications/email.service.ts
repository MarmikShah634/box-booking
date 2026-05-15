import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: Resend | null = null;
  private readonly from: string;
  private readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY') ?? '';
    this.from = this.config.get<string>('EMAIL_FROM') ?? 'noreply@boxcricket.in';
    this.isConfigured = Boolean(apiKey);
    if (this.isConfigured) {
      this.client = new Resend(apiKey);
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.client) return;
    await this.client.emails.send({ from: this.from, to, subject, html });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const link = `${this.config.get('FRONTEND_URL') ?? 'http://localhost:3000'}/reset-password?token=${token}`;
    if (!this.isConfigured) {
      this.logger.warn(`[STUB] Password reset email to ${email}: ${link}`);
      return;
    }
    try {
      await this.send(email, 'Reset your BoxCricket password', `<p>Click <a href="${link}">here</a> to reset your password. This link expires in 1 hour.</p>`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}`, err);
    }
  }

  async sendStepUpOtp(email: string, otp: string, action: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`[STUB] Step-up OTP email to ${email}: action=${action} otp=${otp}`);
      return;
    }
    try {
      await this.send(
        email,
        'Your BoxCricket verification code',
        `<p>Your verification code for <strong>${action}</strong> is: <strong>${otp}</strong>. Valid for 10 minutes.</p>`,
      );
    } catch (err) {
      this.logger.error(`Failed to send step-up OTP email to ${email}`, err);
    }
  }

  async sendBookingConfirmation(
    email: string,
    variables: Record<string, string>,
  ): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`[STUB] Booking confirmation email to ${email}`, variables);
      return;
    }
    try {
      await this.send(
        email,
        'Booking Confirmed - BoxCricket',
        `<p>Your booking is confirmed. Reference: ${variables['bookingId'] ?? ''}. Thank you!</p>`,
      );
    } catch (err) {
      this.logger.error(`Failed to send booking confirmation email to ${email}`, err);
    }
  }

  async sendGeneric(to: string, subject: string, html: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`[STUB] Email to ${to}: ${subject}`);
      return;
    }
    try {
      await this.send(to, subject, html);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
    }
  }
}
