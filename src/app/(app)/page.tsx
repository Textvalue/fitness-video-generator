import { prisma } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";

async function getDashboardData() {
  const [totalGenerations, recentGenerations, costData, recent] = await Promise.all([
    prisma.generation.count({ where: { status: "COMPLETED" } }),
    prisma.generation.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.generation.aggregate({
      _sum: { totalCost: true },
    }),
    prisma.generation.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { exercise: true, trainer: true, environment: true },
    }),
  ]);

  return {
    totalVideos: totalGenerations,
    recentCount: recentGenerations,
    totalCost: costData._sum.totalCost || 0,
    recentGenerations: recent.map((g) => ({
      id: g.id,
      status: g.status,
      exerciseName:
        (g.exercise.name as Record<string, string>).en || "Unknown",
      trainerName: g.trainer.name,
      environmentName: g.environment.name,
      imageUrl: g.generatedImageUrl,
      videoUrl: g.generatedVideoUrl,
      totalCost: g.totalCost,
      createdAt: g.createdAt.toISOString(),
      imagePrompt: g.imagePrompt,
    })),
  };
}

export default async function DashboardPage() {
  let data;
  try {
    data = await getDashboardData();
  } catch {
    // DB not connected yet — show empty state
    data = {
      totalVideos: 0,
      recentCount: 0,
      totalCost: 0,
      recentGenerations: [],
    };
  }

  return <DashboardClient data={data} />;
}
