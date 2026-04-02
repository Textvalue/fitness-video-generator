import { prisma } from "@/lib/db";
import { LibraryClient } from "./library-client";

async function getExercises() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return exercises.map((e) => ({
    id: e.id,
    opensetId: e.opensetId,
    name: e.name as Record<string, string>,
    description: e.description as Record<string, string>,
    bodyParts: e.bodyParts,
    category: e.category,
    equipment: e.equipment,
    difficulty: e.difficulty,
    metadata: e.metadata as Record<string, unknown> | null,
    mediaUrls: e.mediaUrls as { photos?: { url: string; label: string }[] } | null,
  }));
}

export default async function LibraryPage() {
  let exercises: Awaited<ReturnType<typeof getExercises>> = [];
  try {
    exercises = await getExercises();
  } catch {
    exercises = [];
  }

  return <LibraryClient exercises={exercises} />;
}
