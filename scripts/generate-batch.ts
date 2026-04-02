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
const CONCURRENCY = 5; // parallel requests

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
  for (let attempt = 0; attempt < 3; attempt++) {
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
      const msg = (err as Error).message || "";
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.log(`  Rate limited, waiting 15s (attempt ${attempt + 1})...`);
        await new Promise((r) => setTimeout(r, 15000));
        continue;
      }
      console.error(`  Error: ${msg.slice(0, 80)}`);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function processBatch<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
) {
  let idx = 0;
  const total = items.length;

  async function worker() {
    while (idx < total) {
      const i = idx++;
      await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);
}

async function main() {
  // Find exercises that still need images (no AI generated photo)
  const allExercises = await prisma.exercise.findMany({ orderBy: { category: "asc" } });
  const needsImage = allExercises.filter((ex) => {
    const media = ex.mediaUrls as { photos?: { label: string }[] } | null;
    return !media?.photos?.some((p) => p.label === "AI Generated");
  });

  console.log(`\n${needsImage.length} exercises need images (${allExercises.length - needsImage.length} already done)\n`);

  let success = 0;
  let failed = 0;

  await processBatch(needsImage, CONCURRENCY, async (ex, i) => {
    const name = (ex.name as Record<string, string>).en || "exercise";
    const desc = (ex.description as Record<string, string>).en || "";

    console.log(`[${i + 1}/${needsImage.length}] ${name}...`);

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

      console.log(`  ✓ ${name} (${(buffer.length / 1024).toFixed(0)} KB)`);
      success++;
    } else {
      console.log(`  ✗ ${name} FAILED`);
      failed++;
    }
  });

  console.log(`\nExercises: ${success} generated, ${failed} failed\n`);

  // Generate environment previews
  const envs = await prisma.environment.findMany({
    where: { previewUrl: null },
  });

  if (envs.length > 0) {
    console.log(`Generating ${envs.length} environment previews...\n`);

    await processBatch(envs, CONCURRENCY, async (env) => {
      console.log(`  ${env.name}...`);
      const prompt = `Wide cinematic establishing shot of: ${env.prompt}. Empty scene, no people. Professional architectural photography, moody atmosphere, ultra detailed, 8K.`;
      const buffer = await generateImage(prompt);

      if (buffer) {
        const key = `environments/${env.id}/${randomUUID()}.jpg`;
        const url = await uploadImage(key, buffer);
        await prisma.environment.update({
          where: { id: env.id },
          data: { previewUrl: url, previewKey: key },
        });
        console.log(`  ✓ ${env.name} (${(buffer.length / 1024).toFixed(0)} KB)`);
      } else {
        console.log(`  ✗ ${env.name} FAILED`);
      }
    });
  }

  console.log(`\n=== All done! ===`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
