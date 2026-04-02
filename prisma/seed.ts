import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default user
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@kinetic.lab" },
    update: {},
    create: {
      email: "admin@kinetic.lab",
      passwordHash,
      name: "Alex Rivera",
      role: "admin",
    },
  });

  // Seed exercises from CSV
  const csvPath = path.join(process.cwd(), "exercises_rows.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  for (const row of records as Record<string, string>[]) {
    let name: Record<string, string>;
    let description: Record<string, string>;
    let bodyParts: string[];
    let equipment: string[];
    let metadata: Record<string, unknown> | null = null;
    let mediaUrls: Record<string, unknown> | null = null;

    try {
      name = JSON.parse(row.name.replace(/"""/g, '"').replace(/^"|"$/g, ""));
    } catch {
      name = { en: row.name };
    }

    try {
      description = JSON.parse(row.description.replace(/"""/g, '"').replace(/^"|"$/g, ""));
    } catch {
      description = { en: row.description };
    }

    try {
      const raw = row.body_parts.replace(/^"?\[|]"?$/g, "").replace(/"/g, "");
      bodyParts = raw.split(",").map((s: string) => s.trim()).filter(Boolean);
    } catch {
      bodyParts = [];
    }

    try {
      const raw = row.equipment.replace(/^"?\[|]"?$/g, "").replace(/"/g, "");
      equipment = raw.split(",").map((s: string) => s.trim()).filter(Boolean);
    } catch {
      equipment = [];
    }

    try {
      if (row.metadata) metadata = JSON.parse(row.metadata);
    } catch { /* skip */ }

    try {
      if (row.media) mediaUrls = JSON.parse(row.media);
    } catch { /* skip */ }

    const difficulty = parseInt(row.difficulty) || 1;
    const category = row.category || "other";

    await prisma.exercise.upsert({
      where: { opensetId: row.openset_id },
      update: {
        name,
        description,
        bodyParts,
        category,
        equipment,
        difficulty,
        metadata,
        mediaUrls,
      },
      create: {
        opensetId: row.openset_id,
        name,
        description,
        bodyParts,
        category,
        equipment,
        difficulty,
        metadata,
        mediaUrls,
      },
    });
  }

  console.log(`Seeded ${records.length} exercises`);

  // Create default environments
  const environments = [
    {
      name: "Modern Gym",
      description: "Global Lighting: Cinematic Teal",
      prompt: "minimalist brutalist fitness studio, hard rim lighting, volcanic rock textures, 8k cinematic render, deep shadows",
    },
    {
      name: "Outdoor Track",
      description: "Global Lighting: Golden Hour",
      prompt: "high-end athletics track in a futuristic urban park during warm golden sunset with long shadows, 8k render",
    },
    {
      name: "Zen Studio",
      description: "Global Lighting: Soft Diffuse",
      prompt: "bright high-end yoga studio with wooden floors and large windows showing a lush forest background, soft natural lighting, 8k render",
    },
  ];

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@kinetic.lab" } });
  if (adminUser) {
    for (const env of environments) {
      await prisma.environment.upsert({
        where: { id: `env-${env.name.toLowerCase().replace(/\s+/g, "-")}` },
        update: env,
        create: {
          id: `env-${env.name.toLowerCase().replace(/\s+/g, "-")}`,
          ...env,
          userId: adminUser.id,
        },
      });
    }
    console.log("Seeded 3 environments");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
