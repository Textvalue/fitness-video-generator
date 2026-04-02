import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proxyUrl } from "@/lib/media-url";
import { deleteFile } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gen = await prisma.generation.findUnique({ where: { id } });
  if (!gen) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: gen.id,
    status: gen.status,
    imageUrl: proxyUrl(gen.generatedImageUrl),
    videoUrl: proxyUrl(gen.generatedVideoUrl),
    errorMessage: gen.errorMessage,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gen = await prisma.generation.findUnique({ where: { id } });
  if (!gen) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (gen.generatedImageKey) {
    try { await deleteFile(gen.generatedImageKey); } catch {}
  }
  if (gen.generatedVideoKey) {
    try { await deleteFile(gen.generatedVideoKey); } catch {}
  }

  await prisma.costLog.deleteMany({ where: { generationId: id } });
  await prisma.generation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
