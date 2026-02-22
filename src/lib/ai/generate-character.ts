import { getTextModel, getImageModel } from "./client";
import {
  buildCharacterExtractionPrompt,
  buildCharacterImagePrompt,
} from "./prompts";
import fs from "fs";
import path from "path";

interface ExtractedCharacter {
  name: string;
  description: string;
}

export async function extractCharacters(
  pages: { title: string; text: string }[]
): Promise<ExtractedCharacter[]> {
  const model = getTextModel();
  const prompt = buildCharacterExtractionPrompt(pages);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse character extraction response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.characters as ExtractedCharacter[];
}

export async function generateCharacterImage(
  character: { name: string; description: string },
  storyId: string,
  characterId: string
): Promise<string> {
  const model = getImageModel();
  const prompt = buildCharacterImagePrompt(character);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["image", "text"],
    } as never,
  });

  const response = result.response;

  // Find image part in response
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      const inlineData = (part as { inlineData?: { mimeType: string; data: string } }).inlineData;
      if (inlineData) {
        const dir = path.resolve(process.cwd(), "generated", storyId);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const ext = inlineData.mimeType.includes("png") ? "png" : "jpg";
        const filename = `char_${characterId}.${ext}`;
        const filePath = path.join(dir, filename);

        fs.writeFileSync(filePath, Buffer.from(inlineData.data, "base64"));
        return `/generated/${storyId}/${filename}`;
      }
    }
  }

  throw new Error("No image generated for character");
}
