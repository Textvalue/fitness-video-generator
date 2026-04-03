import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFile, uploadFile } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await req.formData();
  const name = formData.get("name") as string | null;
  const file = formData.get("file") as File | null;

  const trainer = await prisma.trainer.findUnique({ where: { id } });
  if (!trainer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, string> = {};
  if (name) data.name = name;

  if (file) {
    // Delete old image
    try { await deleteFile(trainer.baseImageKey); } catch {}
    const bytes = await file.arrayBuffer();
    const ext = file.name.split(".").pop() || "jpg";
    const key = `trainers/${randomUUID()}.${ext}`;
    const url = await uploadFile(key, Buffer.from(bytes), file.type);
    data.baseImageUrl = url;
    data.baseImageKey = key;
  }

  const updated = await prisma.trainer.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainer = await prisma.trainer.findUnique({ where: { id } });
  if (!trainer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { await deleteFile(trainer.baseImageKey); } catch {}
  await prisma.costLog.deleteMany({ where: { generation: { trainerId: id } } });
  await prisma.generation.deleteMany({ where: { trainerId: id } });
  await prisma.trainer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
