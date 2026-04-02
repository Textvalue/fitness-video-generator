import { prisma } from "@/lib/db";
import { TrainersClient } from "./trainers-client";

async function getData() {
  const [trainers, environments] = await Promise.all([
    prisma.trainer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.environment.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return {
    trainers: trainers.map((t) => ({
      id: t.id,
      name: t.name,
      baseImageUrl: t.baseImageUrl,
      createdAt: t.createdAt.toISOString(),
    })),
    environments: environments.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      prompt: e.prompt,
      previewUrl: e.previewUrl,
    })),
  };
}

export default async function TrainersPage() {
  let data;
  try {
    data = await getData();
  } catch {
    data = { trainers: [], environments: [] };
  }

  return <TrainersClient data={data} />;
}
