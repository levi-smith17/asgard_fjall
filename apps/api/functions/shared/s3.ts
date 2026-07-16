import { S3Client } from '@aws-sdk/client-s3'

export const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-2' })

// private, presigned URL reads/writes (receipts, etc.)
export const PRIVATE_MEDIA_BUCKET = process.env.S3_PRIVATE_MEDIA_BUCKET ?? 'asgard-fjall-prod-private-media'

export const PRESIGN_EXPIRES = 3600 // 1 hour

// Allowed MIME types for receipt uploads
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
