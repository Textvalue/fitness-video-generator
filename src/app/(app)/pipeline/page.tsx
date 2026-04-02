import { prisma } from "@/lib/db";
import { PipelineClient } from "./pipeline-client";

async function getData() {
  const [trainers, environments, exercises] = await Promise.all([
    prisma.trainer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.environment.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.exercise.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);

  return {
    trainers: trainers.map((t) => ({ id: t.id, name: t.name, baseImageUrl: t.baseImageUrl })),
    environments: environments.map((e) => ({ id: e.id, name: e.name, prompt: e.prompt })),
    exercises: exercises.map((e) => ({
      id: e.id,
      name: (e.name as Record<string, string>).en || "Unknown",
      description: (e.description as Record<string, string>).en || "",
    })),
  };
}

export default async function PipelinePage() {
  let data;
  try {
    data = await getData();
  } catch {
    data = { trainers: [], environments: [], exercises: [] };
  }

  return <PipelineClient data={data} />;
}
