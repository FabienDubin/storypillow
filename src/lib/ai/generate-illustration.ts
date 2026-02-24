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
  referenceImages: { name: string; description: string; mimeType: string; data: string }[] = []
): Promise<string> {
  const model = getImageModel();

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Add labeled reference images for character consistency
  if (referenceImages.length > 0) {
    parts.push({ text: "Here are the character reference images for this story. Use them to maintain consistent character appearance in the illustration.\n" });

    for (const ref of referenceImages) {
      parts.push({ text: `Character "${ref.name}" (${ref.description}):` });
      parts.push({
        inlineData: {
          mimeType: ref.mimeType,
          data: ref.data,
        },
      });
    }

    parts.push({ text: "\nNow generate the following scene illustration. Make sure each character matches their reference image above exactly (same face, skin color, hair, clothing, gender).\n" });
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
        const filename = `page_${pageId}_${Date.now()}.${ext}`;
        const filePath = path.join(dir, filename);

        // Clean up old page images
        const existing = fs.readdirSync(dir).filter((f) => f.startsWith(`page_${pageId}`) && f !== filename);
        for (const old of existing) {
          fs.unlinkSync(path.join(dir, old));
        }

        fs.writeFileSync(filePath, Buffer.from(inlineData.data, "base64"));
        return `/generated/${storyId}/${filename}`;
      }
    }
  }

  throw new Error("No illustration generated");
}
