import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateImage } from "@/lib/gemini";
import { uploadFile } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { trainerId, environmentId, exerciseId } = await req.json();

  if (!trainerId || !environmentId || !exerciseId) {
    return NextResponse.json(
      { error: "trainerId, environmentId, and exerciseId are required" },
      { status: 400 }
    );
  }

  const [trainer, environment, exercise] = await Promise.all([
    prisma.trainer.findUnique({ where: { id: trainerId } }),
    prisma.environment.findUnique({ where: { id: environmentId } }),
    prisma.exercise.findUnique({ where: { id: exerciseId } }),
  ]);

  if (!trainer || !environment || !exercise) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const user = await prisma.user.findFirst();
  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 500 });
  }

  const exerciseName = (exercise.name as Record<string, string>).en || "exercise";
  const exerciseDesc = (exercise.description as Record<string, string>).en || "";

  // Compose the image generation prompt
  const prompt = `Generate a photorealistic image of a fitness trainer in the starting position of "${exerciseName}".
Exercise description: ${exerciseDesc}
Environment: ${environment.prompt}
The trainer should be in proper athletic form, ready to begin the exercise. High quality, 8K, cinematic lighting.`;

  // Create generation record
  const generation = await prisma.generation.create({
    data: {
      trainerId,
      environmentId,
      exerciseId,
      userId: user.id,
      status: "IMAGE_GENERATING",
      imagePrompt: prompt,
    },
  });

  try {
    // Fetch trainer image and convert to base64
    let trainerBase64: string | undefined;
    try {
      const trainerRes = await fetch(trainer.baseImageUrl);
      const trainerBuffer = Buffer.from(await trainerRes.arrayBuffer());
      trainerBase64 = trainerBuffer.toString("base64");
    } catch {
      // If we can't fetch the trainer image, generate without reference
    }

    const result = await generateImage(prompt, trainerBase64);

    if (!result.imageData) {
      throw new Error("No image generated");
    }

    // Upload to MinIO
    const imageBuffer = Buffer.from(result.imageData.base64, "base64");
    const key = `generations/${generation.id}/${randomUUID()}.png`;
    const imageUrl = await uploadFile(key, imageBuffer, "image/png");

    // Update generation
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        generatedImageUrl: imageUrl,
        generatedImageKey: key,
        status: "VIDEO_GENERATING",
      },
    });

    // Log cost
    await prisma.costLog.create({
      data: {
        generationId: generation.id,
        apiType: "NANO_BANANA",
        model: "gemini-2.0-flash-exp",
        cost: 0.02, // Approximate cost
      },
    });

    return NextResponse.json({
      generationId: generation.id,
      imageUrl,
    });
  } catch (error) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
