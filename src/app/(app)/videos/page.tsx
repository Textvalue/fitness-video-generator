import { prisma } from "@/lib/db";
import { proxyUrl } from "@/lib/media-url";
import { VideosClient } from "./videos-client";

async function getVideos() {
  const generations = await prisma.generation.findMany({
    where: {
      generatedVideoUrl: { not: null },
      status: "COMPLETED",
    },
    include: {
      exercise: true,
      trainer: true,
      environment: true,
    },
    orderBy: { completedAt: "desc" },
  });

  return generations.map((g) => ({
    id: g.id,
    exerciseId: g.exerciseId,
    exerciseName: (g.exercise.name as Record<string, string>).en || (g.exercise.name as Record<string, string>).hr || "Exercise",
    exerciseCategory: g.exercise.category,
    trainerName: g.trainer.name,
    trainerImageUrl: proxyUrl(g.trainer.baseImageUrl) || g.trainer.baseImageUrl,
    environmentName: g.environment?.name || "From Photo",
    imageUrl: proxyUrl(g.generatedImageUrl),
    videoUrl: proxyUrl(g.generatedVideoUrl)!,
    veoVersion: g.veoVersion,
    duration: g.videoPrompt ? null : null, // not stored yet
    completedAt: g.completedAt?.toISOString() || g.createdAt.toISOString(),
    totalCost: g.totalCost,
  }));
}

export default async function VideosPage() {
  let videos: Awaited<ReturnType<typeof getVideos>> = [];
  try {
    videos = await getVideos();
  } catch {
    videos = [];
  }

  return <VideosClient videos={videos} />;
}
