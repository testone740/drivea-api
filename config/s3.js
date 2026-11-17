// https://youtu.be/3X__DaWC3mY?t=33160

import { S3Client } from '@aws-sdk/client-s3';
import 'dotenv/config';

export const BUCKET_NAME = process.env.BUCKET_NAME || 'drive-bucket';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
