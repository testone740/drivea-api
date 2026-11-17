// https://youtu.be/3X__DaWC3mY?t=33240

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectVersionsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BUCKET_NAME, s3Client } from '../config/s3.js';

// Upload file to Neon Object Storage
export const uploadToStorage = async (fileBuffer, key, mimeType) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
};

// Get presigned download/preview URL for a file
export const getSignedFileUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
  return { s3Key: key };
};

// Permanently delete on object and its versions from Neon Object Storage
export const deleteFromStorage = async (key) => {
  if (!key) return;

  try {
    const { Versions = [], DeleteMarkers = [] } = await s3Client.send(
      new ListObjectVersionsCommand({
        Bucket: BUCKET_NAME,
        Prefix: key,
      })
    );

    const Objects = [...Versions, ...DeleteMarkers]
      .filter((v) => v.key)
      .map(({ Key, VersionId }) => ({ Key, VersionId }));

    if (Objects.length > 0) {
      await s3Client.send(new DeleteObjectsCommand({ Bucket: BUCKET_NAME, Delete: { Objects } }));
    } else {
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    }
  } catch (err) {
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    } catch (fallbackErr) {
      console.error('[Storage Delete Error]:', fallbackErr.message);
      throw fallbackErr;
    }
  }
};

// Batch permanently delete multiple keys from Neon Object Storage
export const deleteMultipleFromStorage = async (keys) => {
  if (!keys.length) return;

  await Promise.all(keys.map(deleteFromStorage));
};
