import { getTextModel } from "./client";
import { buildTextPrompt } from "./prompts";
import type { PlanItem } from "@/types";

interface GenerateTextResult {
  pages: { title: string; text: string }[];
}

export async function generateText(params: {
  title: string;
  plan: PlanItem[];
  theme: string;
  setting: string;
  tone: string;
  moral: string;
  duration: number;
  childName: string;
  context: string;
}): Promise<GenerateTextResult> {
  const model = getTextModel();
  const prompt = buildTextPrompt(params);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*?\}(?=[^}]*$)/);
  if (!jsonMatch) {
    throw new Error("Failed to parse text response from AI");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed.pages)) {
    throw new Error("Invalid text structure: missing pages array");
  }
  for (const page of parsed.pages) {
    if (!page.title || typeof page.title !== "string") {
      throw new Error("Invalid page: missing title");
    }
    if (!page.text || typeof page.text !== "string") {
      throw new Error("Invalid page: missing text");
    }
  }

  return parsed as GenerateTextResult;
}
