import { PrismaClient } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const s3 = new S3Client({
  endpoint: process.env.TIGRIS_ENDPOINT!,
  region: process.env.TIGRIS_REGION || "auto",
  credentials: {
    accessKeyId: process.env.TIGRIS_ACCESS_KEY!,
    secretAccessKey: process.env.TIGRIS_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.TIGRIS_BUCKET!;
const MODEL = "gemini-3.1-flash-image-preview";

async function uploadImage(key: string, buffer: Buffer): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
      ACL: "public-read",
    })
  );
  return `${process.env.TIGRIS_ENDPOINT}/${BUCKET}/${key}`;
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: { imageSize: "1K" },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
    return null;
  } catch (err) {
    console.error("  Generation failed:", (err as Error).message?.slice(0, 80));
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // 1. Generate exercise images
  const exercises = await prisma.exercise.findMany({ orderBy: { category: "asc" } });
  console.log(`\n=== Generating images for ${exercises.length} exercises ===\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const name = (ex.name as Record<string, string>).en || "exercise";
    const desc = (ex.description as Record<string, string>).en || "";
    const category = ex.category;

    console.log(`[${i + 1}/${exercises.length}] ${name} (${category})...`);

    const prompt = `Professional fitness photography: athlete demonstrating "${name}" exercise. ${desc}. Dark modern gym environment, dramatic cinematic lighting, high contrast, 8K quality. Show proper form and technique. No text overlays.`;

    const buffer = await generateImage(prompt);

    if (buffer) {
      const key = `exercises/${ex.id}/${randomUUID()}.jpg`;
      const url = await uploadImage(key, buffer);

      await prisma.exercise.update({
        where: { id: ex.id },
        data: {
          mediaUrls: {
            photos: [
              { url, label: "AI Generated" },
              ...((ex.mediaUrls as any)?.photos || []),
            ],
          },
        },
      });

      console.log(`  ✓ Saved (${(buffer.length / 1024).toFixed(0)} KB)`);
      success++;
    } else {
      console.log(`  ✗ Failed`);
      failed++;
    }

    // Rate limit: ~4 requests per minute for image gen
    if (i < exercises.length - 1) {
      await sleep(4000);
    }
  }

  console.log(`\nExercises: ${success} generated, ${failed} failed\n`);

  // 2. Generate environment preview images
  const environments = await prisma.environment.findMany();
  console.log(`=== Generating images for ${environments.length} environments ===\n`);

  for (const env of environments) {
    console.log(`Environment: ${env.name}...`);

    const prompt = `Wide cinematic establishing shot of: ${env.prompt}. Empty scene, no people. Professional architectural photography, moody atmosphere, ultra detailed, 8K.`;

    const buffer = await generateImage(prompt);

    if (buffer) {
      const key = `environments/${env.id}/${randomUUID()}.jpg`;
      const url = await uploadImage(key, buffer);

      await prisma.environment.update({
        where: { id: env.id },
        data: {
          previewUrl: url,
          previewKey: key,
        },
      });

      console.log(`  ✓ Saved (${(buffer.length / 1024).toFixed(0)} KB)`);
    } else {
      console.log(`  ✗ Failed`);
    }

    await sleep(4000);
  }

  console.log(`\n=== Done! ===`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
