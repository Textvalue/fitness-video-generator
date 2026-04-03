import { prisma } from "@/lib/db";
import { proxyUrl } from "@/lib/media-url";
import { BulkGenerateClient } from "./bulk-generate-client";

async function getExercises() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { category: "asc" },
  });
  return exercises.map((e) => ({
    id: e.id,
    name: e.name as Record<string, string>,
    description: e.description as Record<string, string>,
    generationPrompt: e.generationPrompt,
    bodyParts: e.bodyParts,
    category: e.category,
    equipment: e.equipment,
    difficulty: e.difficulty,
  }));
}

async function getTrainers() {
  const trainers = await prisma.trainer.findMany({ orderBy: { createdAt: "desc" } });
  return trainers.map((t) => ({
    id: t.id,
    name: t.name,
    baseImageUrl: t.baseImageUrl,
    baseImageKey: t.baseImageKey,
  }));
}

async function getEnvironments() {
  const environments = await prisma.environment.findMany({ orderBy: { createdAt: "desc" } });
  return environments.map((e) => ({
    id: e.id,
    name: e.name,
    prompt: e.prompt,
    previewUrl: e.previewUrl,
  }));
}

async function getExistingGenerations() {
  const generations = await prisma.generation.findMany({
    where: {
      generatedImageUrl: { not: null },
      status: { in: ["VIDEO_GENERATING", "COMPLETED", "FAILED"] },
    },
    include: { trainer: true },
    orderBy: { createdAt: "desc" },
  });
  return generations.map((g) => ({
    id: g.id,
    exerciseId: g.exerciseId,
    trainerId: g.trainerId,
    trainerName: g.trainer.name,
    imageUrl: proxyUrl(g.generatedImageUrl) || g.generatedImageUrl!,
    videoUrl: proxyUrl(g.generatedVideoUrl),
    status: g.status,
  }));
}

export default async function BulkGeneratePage() {
  let exercises: Awaited<ReturnType<typeof getExercises>> = [];
  let trainers: Awaited<ReturnType<typeof getTrainers>> = [];
  let environments: Awaited<ReturnType<typeof getEnvironments>> = [];
  let existingGenerations: Awaited<ReturnType<typeof getExistingGenerations>> = [];

  try {
    [exercises, trainers, environments, existingGenerations] = await Promise.all([
      getExercises(),
      getTrainers(),
      getEnvironments(),
      getExistingGenerations(),
    ]);
  } catch {
    exercises = [];
    trainers = [];
    environments = [];
    existingGenerations = [];
  }

  return (
    <BulkGenerateClient
      exercises={exercises}
      trainers={trainers}
      environments={environments}
      existingGenerations={existingGenerations}
    />
  );
}
