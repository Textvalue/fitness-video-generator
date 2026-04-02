import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const environments = await prisma.environment.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(environments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, prompt } = body;

  if (!name || !prompt) {
    return NextResponse.json({ error: "Name and prompt required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst();
  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 500 });
  }

  const environment = await prisma.environment.create({
    data: {
      name,
      description,
      prompt,
      userId: user.id,
    },
  });

  return NextResponse.json(environment);
}
