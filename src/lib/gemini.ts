import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const NANO_BANANA_MODEL = "gemini-3.1-flash-image-preview";
export const VEO_MODELS = {
  "veo-3.1": "veo-3.1-generate-preview",
  "veo-3.1-fast": "veo-3.1-fast-generate-preview",
  "veo-3.0": "veo-3.0-generate-001",
} as const;

export type VeoVersion = keyof typeof VEO_MODELS;

export async function generateImage(
  prompt: string,
  referenceImageBase64?: string,
  referenceImageMimeType: string = "image/jpeg"
) {
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (referenceImageBase64) {
    parts.push({
      inlineData: {
        mimeType: referenceImageMimeType,
        data: referenceImageBase64,
      },
    });
  }

  parts.push({ text: prompt });

  const contents = [
    {
      role: "user" as const,
      parts,
    },
  ];

  const response = await ai.models.generateContent({
    model: NANO_BANANA_MODEL,
    contents,
    config: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: {
        imageSize: "1K",
      },
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts || [];
  let imageData: { base64: string; mimeType: string } | null = null;
  let text = "";

  for (const part of responseParts) {
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
  referenceImageBase64?: string,
  referenceImageMimeType: string = "image/png"
) {
  const model = VEO_MODELS[veoVersion];

  let operation = await ai.models.generateVideos({
    model,
    ...(referenceImageBase64
      ? {
          // Image-to-video: pass image directly
          image: {
            imageBytes: referenceImageBase64,
            mimeType: referenceImageMimeType,
          },
        }
      : {
          // Text-to-video: prompt only
          prompt,
        }),
    config: {
      numberOfVideos: 1,
      aspectRatio: "16:9",
      resolution: "720p",
      durationSeconds: 8,
    },
  });

  // Poll until done using getVideosOperation
  while (!operation.done) {
    await new Promise((r) => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({
      operation,
    });
  }

  const video = operation.response?.generatedVideos?.[0];
  if (!video?.video?.uri) {
    throw new Error("Video generation failed: no video URI returned");
  }

  // Download the video (requires API key appended to URI)
  const videoUrl = `${video.video.uri}&key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(videoUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    videoUri: video.video.uri,
    videoBuffer: buffer,
  };
}

export { ai };
