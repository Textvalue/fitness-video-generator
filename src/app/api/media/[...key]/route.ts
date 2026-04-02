import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = process.env.TIGRIS_BUCKET || "organized-room-aaohr-xd1x";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const objectKey = key.join("/");

  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: objectKey })
    );

    const body = await response.Body?.transformToByteArray();
    if (!body) {
      return NextResponse.json({ error: "Empty body" }, { status: 404 });
    }

    return new NextResponse(Buffer.from(body), {
      headers: {
        "Content-Type": response.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
