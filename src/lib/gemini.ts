import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const NANO_BANANA_MODEL = "gemini-2.0-flash-exp";
export const VEO_MODELS = {
  "veo-3.1": "veo-3.1-generate-preview",
  "veo-3.1-fast": "veo-3.1-fast-generate-preview",
  "veo-3.0": "veo-3.0-generate-001",
} as const;

export type VeoVersion = keyof typeof VEO_MODELS;

export async function generateImage(prompt: string, referenceImageBase64?: string) {
  const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (referenceImageBase64) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: referenceImageBase64,
      },
    });
  }

  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: NANO_BANANA_MODEL,
    contents: contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  let imageData: { base64: string; mimeType: string } | null = null;
  let text = "";

  for (const part of parts) {
    if (part.inlineData) {
      imageData = {
        base64: part.inlineData.data!,
        mimeType: part.inlineData.mimeType!,
      };
    }
    if (part.text) {
      text += part.text;
    }
  }

  return { imageData, text };
}

export async function generateVideo(
  prompt: string,
  veoVersion: VeoVersion = "veo-3.1",
  referenceImageBase64?: string
) {
  const model = VEO_MODELS[veoVersion];

  const config: Record<string, unknown> = {
    aspectRatio: "16:9",
  };

  if (referenceImageBase64) {
    config.image = {
      imageBytes: referenceImageBase64,
      mimeType: "image/png",
    };
  }

  let operation = await ai.models.generateVideos({
    model,
    prompt,
    config,
  });

  // Poll until done
  while (!operation.done) {
    await new Promise((r) => setTimeout(r, 10000));
    operation = await ai.operations.get({ operation });
  }

  const video = operation.response?.generatedVideos?.[0];
  if (!video?.video?.uri) {
    throw new Error("Video generation failed: no video URI returned");
  }

  return {
    videoUri: video.video.uri,
  };
}

export { ai };
