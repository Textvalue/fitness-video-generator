import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/storage";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, prompt, description } = body;

  const env = await prisma.environment.findUnique({ where: { id } });
  if (!env) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.environment.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(prompt && { prompt }),
      ...(description !== undefined && { description }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const env = await prisma.environment.findUnique({ where: { id } });
  if (!env) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (env.previewKey) {
    try { await deleteFile(env.previewKey); } catch {}
  }
  await prisma.environment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
