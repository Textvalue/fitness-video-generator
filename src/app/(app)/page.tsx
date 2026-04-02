import { prisma } from "@/lib/db";
import { proxyUrl } from "@/lib/media-url";
import { LibraryClient } from "./library-client";

async function getExercises() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { category: "asc" },
  });
  return exercises.map((e) => {
    const media = e.mediaUrls as { photos?: { url: string; label: string }[] } | null;
    return {
      id: e.id,
      name: e.name as Record<string, string>,
      description: e.description as Record<string, string>,
      generationPrompt: e.generationPrompt,
      bodyParts: e.bodyParts,
      category: e.category,
      equipment: e.equipment,
      difficulty: e.difficulty,
      mediaUrls: media?.photos
        ? { photos: media.photos.map((p) => ({ ...p, url: proxyUrl(p.url) || p.url })) }
        : null,
    };
  });
}

async function getGenerations() {
  const generations = await prisma.generation.findMany({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      exerciseId: true,
      generatedImageUrl: true,
      generatedVideoUrl: true,
      veoVersion: true,
      completedAt: true,
    },
  });
  return generations.map((g) => ({
    id: g.id,
    exerciseId: g.exerciseId,
    imageUrl: proxyUrl(g.generatedImageUrl),
    videoUrl: proxyUrl(g.generatedVideoUrl),
    veoVersion: g.veoVersion,
    completedAt: g.completedAt?.toISOString() || null,
  }));
}

export default async function HomePage() {
  let exercises: Awaited<ReturnType<typeof getExercises>> = [];
  let generations: Awaited<ReturnType<typeof getGenerations>> = [];
  try {
    [exercises, generations] = await Promise.all([getExercises(), getGenerations()]);
  } catch {
    exercises = [];
    generations = [];
  }

  return <LibraryClient exercises={exercises} generations={generations} />;
}
