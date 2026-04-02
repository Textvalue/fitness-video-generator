import { prisma } from "@/lib/db";
import { proxyUrl } from "@/lib/media-url";
import { TrainersClient } from "./trainers-client";

export default async function TrainersPage() {
  let trainers: { id: string; name: string; imageUrl: string }[] = [];
  try {
    const data = await prisma.trainer.findMany({ orderBy: { createdAt: "desc" } });
    trainers = data.map((t) => ({
      id: t.id,
      name: t.name,
      imageUrl: proxyUrl(t.baseImageUrl) || t.baseImageUrl,
    }));
  } catch {
    trainers = [];
  }

  return <TrainersClient trainers={trainers} />;
}
