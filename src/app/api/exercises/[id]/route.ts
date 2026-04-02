import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(exercise);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, bodyParts, category, equipment, difficulty } = body;

  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.exercise.update({
    where: { id },
    data: {
      ...(name && { name: typeof name === "string" ? { en: name } : name }),
      ...(description && { description: typeof description === "string" ? { en: description } : description }),
      ...(bodyParts && { bodyParts }),
      ...(category && { category }),
      ...(equipment && { equipment }),
      ...(difficulty !== undefined && { difficulty }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
