import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, bodyParts, category, equipment, difficulty, generationPrompt } = body;

  if (!name || !description || !category) {
    return NextResponse.json(
      { error: "Name, description, and category required" },
      { status: 400 }
    );
  }

  const exercise = await prisma.exercise.create({
    data: {
      name: typeof name === "string" ? { en: name } : name,
      description: typeof description === "string" ? { en: description } : description,
      bodyParts: bodyParts || [],
      category,
      equipment: equipment || [],
      difficulty: difficulty || 1,
      generationPrompt: generationPrompt || null,
    },
  });

  return NextResponse.json(exercise);
}
