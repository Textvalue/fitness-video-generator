import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function GET() {
  const trainers = await prisma.trainer.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(trainers);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const name = (formData.get("name") as string) || "Trainer";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() || "jpg";
  const key = `trainers/${randomUUID()}.${ext}`;

  const url = await uploadFile(key, buffer, file.type);

  // For now, use first user as default
  const user = await prisma.user.findFirst();
  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 500 });
  }

  const trainer = await prisma.trainer.create({
    data: {
      name,
      baseImageUrl: url,
      baseImageKey: key,
      userId: user.id,
    },
  });

  return NextResponse.json(trainer);
}
