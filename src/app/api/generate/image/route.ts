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

  // Fetch trainer image first so we can tailor the prompt
  let trainerBase64: string | undefined;
  try {
    const trainerRes = await fetch(trainer.baseImageUrl);
    if (trainerRes.ok) {
      const trainerBuffer = Buffer.from(await trainerRes.arrayBuffer());
      if (trainerBuffer.length < 4 * 1024 * 1024) {
        trainerBase64 = trainerBuffer.toString("base64");
      }
    }
  } catch {
    // If we can't fetch the trainer image, generate without reference
  }

  // Compose the image generation prompt — when we have a reference image,
  // explicitly instruct the model to match the person's appearance
  const prompt = trainerBase64
    ? `Generate a photorealistic image of the EXACT same person shown in the reference photo. This person is a fitness trainer named "${trainer.name}". Show them in the starting position of "${exerciseName}".
Exercise description: ${exerciseDesc}
Environment: ${environment.prompt}
IMPORTANT: The generated person must match the reference photo — same face, same gender, same body type, same skin tone. The trainer should be in proper athletic form, ready to begin the exercise. High quality, 8K, cinematic lighting.`
    : `Generate a photorealistic image of a fitness trainer named "${trainer.name}" in the starting position of "${exerciseName}".
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
    // Try with reference image first, fall back to without
    let result;
    try {
      result = await generateImage(prompt, trainerBase64);
    } catch {
      // If reference image causes issues, try without it
      result = await generateImage(prompt);
    }

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
        model: "gemini-3.1-flash-image-preview",
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
