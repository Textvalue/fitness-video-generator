import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proxyUrl } from "@/lib/media-url";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
  }

  const ids = idsParam.split(",").filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json([]);
  }

  const generations = await prisma.generation.findMany({
    where: { id: { in: ids } },
  });

  const result = generations.map((g) => ({
    id: g.id,
    status: g.status,
    imageUrl: proxyUrl(g.generatedImageUrl),
    videoUrl: proxyUrl(g.generatedVideoUrl),
    errorMessage: g.errorMessage,
  }));

  return NextResponse.json(result);
}
