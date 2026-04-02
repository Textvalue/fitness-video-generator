import { prisma } from "@/lib/db";
import { proxyUrl } from "@/lib/media-url";
import { EnvironmentsClient } from "./environments-client";

export default async function EnvironmentsPage() {
  let environments: { id: string; name: string; description: string | null; prompt: string; previewUrl: string | null }[] = [];
  try {
    const data = await prisma.environment.findMany({ orderBy: { createdAt: "desc" } });
    environments = data.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      prompt: e.prompt,
      previewUrl: proxyUrl(e.previewUrl),
    }));
  } catch {
    environments = [];
  }

  return <EnvironmentsClient environments={environments} />;
}
