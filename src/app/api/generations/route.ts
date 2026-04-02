import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const generations = await prisma.generation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      trainer: true,
      environment: true,
      exercise: true,
      costLogs: true,
    },
  });

  return NextResponse.json(generations);
}
