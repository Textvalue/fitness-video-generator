import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { generateVideo, VeoVersion } from "@/lib/gemini";
import { uploadFile, downloadFile } from "@/lib/storage";
import { randomUUID } from "crypto";

export const maxDuration = 300; // 5 min timeout for background work

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
  const exercisePrompt = generation.exercise.generationPrompt || "";

  const movementDetail = exercisePrompt || exerciseDesc;
  const videoPrompt = `Cinematic fitness video of a trainer performing "${exerciseName}". ${movementDetail}. Environment: ${generation.environment.prompt}. Smooth, professional camera movement, proper exercise form and technique, high production value.`;

  await prisma.generation.update({
    where: { id: generationId },
    data: {
      status: "VIDEO_GENERATING",
      veoVersion,
      videoPrompt,
    },
  });

  // Run video generation in the background — response returns immediately
  after(async () => {
    try {
      let imageBase64: string | undefined;
      if (generation.generatedImageKey) {
        try {
          const imgBuffer = await downloadFile(generation.generatedImageKey);
          imageBase64 = imgBuffer.toString("base64");
        } catch (err) {
          console.warn("Failed to download generated image from storage:", err);
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
    } catch (error) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  });

  // Return immediately — client polls /api/generations/[id] for status
  return NextResponse.json({ generationId, status: "VIDEO_GENERATING" });
}
