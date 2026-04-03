import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateImage } from "@/lib/gemini";
import { uploadFile, downloadFile } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
  const { trainerId, environmentId, exerciseId, useTrainerEnvironment } = await req.json();

  if (!trainerId || !exerciseId) {
    return NextResponse.json(
      { error: "trainerId and exerciseId are required" },
      { status: 400 }
    );
  }

  if (!environmentId && !useTrainerEnvironment) {
    return NextResponse.json(
      { error: "environmentId or useTrainerEnvironment is required" },
      { status: 400 }
    );
  }

  const [trainer, environment, exercise] = await Promise.all([
    prisma.trainer.findUnique({ where: { id: trainerId } }),
    environmentId ? prisma.environment.findUnique({ where: { id: environmentId } }) : null,
    prisma.exercise.findUnique({ where: { id: exerciseId } }),
  ]);

  if (!trainer || (!environment && !useTrainerEnvironment) || !exercise) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const user = await prisma.user.findFirst();
  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 500 });
  }

  const exerciseName = (exercise.name as Record<string, string>).en || "exercise";
  const exerciseDesc = (exercise.description as Record<string, string>).en || "";
  const exercisePrompt = exercise.generationPrompt || "";

  // Download trainer image from S3 directly using the storage key
  let trainerBase64: string | undefined;
  const trainerMimeType = trainer.baseImageKey.endsWith(".png") ? "image/png" : "image/jpeg";
  try {
    const trainerBuffer = await downloadFile(trainer.baseImageKey);
    if (trainerBuffer.length < 4 * 1024 * 1024) {
      trainerBase64 = trainerBuffer.toString("base64");
    }
  } catch (err) {
    console.warn("Failed to download trainer image from storage:", err);
  }

  // Compose the image generation prompts — one for reference-image editing,
  // one fallback for text-only generation
  const movementInstructions = exercisePrompt
    ? `Exercise-specific instructions: ${exercisePrompt}`
    : `Exercise description: ${exerciseDesc}`;

  const environmentLine = useTrainerEnvironment
    ? "Environment: Keep the exact same background, setting, and environment from the original photo. Do not change the surroundings."
    : `Environment: ${environment!.prompt}`;

  const referencePrompt = `Edit this photo of a person: place them performing the exercise "${exerciseName}". Keep the person exactly as they are — do not change their face, gender, body, skin tone, or identity. Only change their pose${useTrainerEnvironment ? "" : " and surroundings"}.
${movementInstructions}
${environmentLine}
Show proper athletic form with correct technique. High quality, cinematic lighting.`;

  const fallbackPrompt = `Generate a photorealistic image of a fitness trainer named "${trainer.name}" performing "${exerciseName}".
${movementInstructions}
${environmentLine}
The trainer should be in proper athletic form with correct technique. High quality, 8K, cinematic lighting.`;

  const prompt = trainerBase64 ? referencePrompt : fallbackPrompt;

  // Create generation record
  const generation = await prisma.generation.create({
    data: {
      trainer: { connect: { id: trainerId } },
      exercise: { connect: { id: exerciseId } },
      user: { connect: { id: user.id } },
      ...(environmentId ? { environment: { connect: { id: environmentId } } } : {}),
      status: "IMAGE_GENERATING",
      imagePrompt: prompt,
    },
  });

  try {
    // Try with reference image first, fall back to text-only prompt without reference
    let result;
    if (trainerBase64) {
      try {
        result = await generateImage(referencePrompt, trainerBase64, trainerMimeType);
        if (!result.imageData) {
          console.warn("Image generation with reference returned no image (model response text:", result.text, "), retrying with text-only prompt");
          result = await generateImage(fallbackPrompt);
        }
      } catch (refError) {
        console.warn("Image generation with reference failed, retrying with text-only prompt:", refError);
        result = await generateImage(fallbackPrompt);
      }
    } else {
      result = await generateImage(fallbackPrompt);
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
  } catch (err) {
    console.error("Unhandled error in generate/image:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
