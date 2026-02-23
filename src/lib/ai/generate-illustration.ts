import { getImageModel, getTextModel } from "./client";
import { buildImagePromptSuggestions } from "./prompts";
import fs from "fs";
import path from "path";

export async function generateImagePrompts(
  pages: { title: string; text: string }[],
  characters: { name: string; description: string }[]
): Promise<string[]> {
  const model = getTextModel();
  const prompt = buildImagePromptSuggestions(pages, characters);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*?\}(?=[^}]*$)/);
  if (!jsonMatch) {
    throw new Error("Failed to parse image prompt suggestions");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed.prompts)) {
    throw new Error("Invalid prompt suggestions: missing prompts array");
  }

  return parsed.prompts as string[];
}

export async function generateIllustration(
  imagePrompt: string,
  storyId: string,
  pageId: string,
  referenceImages: { mimeType: string; data: string }[] = []
): Promise<string> {
  const model = getImageModel();

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Add reference images first (for character consistency)
  for (const ref of referenceImages) {
    parts.push({
      inlineData: {
        mimeType: ref.mimeType,
        data: ref.data,
      },
    });
  }

  // Add the prompt
  parts.push({ text: imagePrompt });

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["image", "text"],
    } as never,
  });

  const response = result.response;

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      const inlineData = (part as { inlineData?: { mimeType: string; data: string } }).inlineData;
      if (inlineData) {
        const dir = path.resolve(process.cwd(), "generated", storyId);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const ext = inlineData.mimeType.includes("png") ? "png" : "jpg";
        const filename = `page_${pageId}.${ext}`;
        const filePath = path.join(dir, filename);

        fs.writeFileSync(filePath, Buffer.from(inlineData.data, "base64"));
        return `/generated/${storyId}/${filename}`;
      }
    }
  }

  throw new Error("No illustration generated");
}
