import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateVideo, VeoVersion } from "@/lib/gemini";
import { uploadFile } from "@/lib/storage";
import { randomUUID } from "crypto";

export const maxDuration = 300; // 5 min timeout for video generation

export async function POST(req: NextRequest) {
  const { generationId, veoVersion = "veo-3.1" } = await req.json();

  if (!generationId) {
    return NextResponse.json(
      { error: "generationId is required" },
      { status: 400 }
    );
  }

  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
    include: { exercise: true, environment: true },
  });

  if (!generation) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  const exerciseName = (generation.exercise.name as Record<string, string>).en || "exercise";
  const exerciseDesc = (generation.exercise.description as Record<string, string>).en || "";

  const videoPrompt = `Cinematic fitness video of a trainer performing "${exerciseName}". ${exerciseDesc}. Environment: ${generation.environment.prompt}. Smooth, professional camera movement, proper exercise form, high production value.`;

  await prisma.generation.update({
    where: { id: generationId },
    data: {
      status: "VIDEO_GENERATING",
      veoVersion,
      videoPrompt,
    },
  });

  try {
    let imageBase64: string | undefined;
    if (generation.generatedImageUrl) {
      try {
        const imgRes = await fetch(generation.generatedImageUrl);
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        imageBase64 = imgBuffer.toString("base64");
      } catch {
        // Generate without reference image
      }
    }

    const result = await generateVideo(videoPrompt, veoVersion as VeoVersion, imageBase64);

    const key = `generations/${generationId}/${randomUUID()}.mp4`;
    const videoUrl = await uploadFile(key, result.videoBuffer, "video/mp4");

    const costMap: Record<string, number> = {
      "veo-3.1": 0.50,
      "veo-3.1-fast": 0.25,
      "veo-3.0": 0.35,
    };
    const videoCost = costMap[veoVersion] || 0.50;
    const imageCost = generation.imageCost || 0.02;

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        generatedVideoUrl: videoUrl,
        generatedVideoKey: key,
        status: "COMPLETED",
        videoCost,
        imageCost,
        totalCost: imageCost + videoCost,
        completedAt: new Date(),
      },
    });

    await prisma.costLog.create({
      data: {
        generationId,
        apiType: "VEO",
        model: veoVersion,
        cost: videoCost,
      },
    });

    return NextResponse.json({ videoUrl, generationId });
  } catch (error) {
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video generation failed" },
      { status: 500 }
    );
  }
}
