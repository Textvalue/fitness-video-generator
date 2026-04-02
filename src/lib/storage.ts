import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  endpoint: process.env.TIGRIS_ENDPOINT!,
  region: process.env.TIGRIS_REGION || "auto",
  credentials: {
    accessKeyId: process.env.TIGRIS_ACCESS_KEY!,
    secretAccessKey: process.env.TIGRIS_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.TIGRIS_BUCKET || "organized-room-aaohr-xd1x";

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${process.env.TIGRIS_ENDPOINT}/${BUCKET}/${key}`;
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}
