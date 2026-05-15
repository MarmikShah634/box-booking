import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const UPLOAD_TTL_SECONDS = 5 * 60; // 5 min
const DOWNLOAD_TTL_SECONDS = 15 * 60; // 15 min

export type UploadPurpose = 'venue-photo' | 'box-photo' | 'invoice' | 'kyc';

@Injectable()
export class R2Service implements OnModuleInit {
  private readonly logger = new Logger(R2Service.name);
  private client!: S3Client;
  private bucket!: string;
  private isConfigured = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET') ?? 'boxcricket';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.warn('R2 credentials not configured — storage will be stubbed');
      return;
    }

    this.isConfigured = true;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async presignUpload(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    if (!this.isConfigured) {
      this.logger.warn(`[STUB] Presign upload for key=${key}`);
      return { uploadUrl: `https://stub.r2.dev/upload/${key}`, key };
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: UPLOAD_TTL_SECONDS });
    return { uploadUrl, key };
  }

  async presignDownload(key: string): Promise<string> {
    if (!this.isConfigured) {
      this.logger.warn(`[STUB] Presign download for key=${key}`);
      return `https://stub.r2.dev/download/${key}`;
    }

    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: DOWNLOAD_TTL_SECONDS });
  }

  buildKey(purpose: UploadPurpose, ownerId: string, filename: string): string {
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ts = Date.now();
    return `${purpose}/${ownerId}/${ts}-${sanitized}`;
  }
}
