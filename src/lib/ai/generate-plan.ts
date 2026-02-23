import { getTextModel } from "./client";
import { buildPlanPrompt } from "./prompts";
import type { PlanItem } from "@/types";

interface GeneratePlanResult {
  title: string;
  plan: PlanItem[];
}

export async function generatePlan(params: {
  theme: string;
  setting: string;
  tone: string;
  moral: string;
  duration: number;
  childName: string;
  context: string;
}): Promise<GeneratePlanResult> {
  const model = getTextModel();
  const prompt = buildPlanPrompt(params);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Extract JSON from the response (non-greedy)
  const jsonMatch = text.match(/\{[\s\S]*?\}(?=[^}]*$)/);
  if (!jsonMatch) {
    throw new Error("Failed to parse plan response from AI");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.title || typeof parsed.title !== "string") {
    throw new Error("Invalid plan structure: missing title");
  }
  if (!Array.isArray(parsed.plan)) {
    throw new Error("Invalid plan structure: missing plan array");
  }
  for (const item of parsed.plan) {
    if (!item.title || !item.description) {
      throw new Error("Invalid plan item: missing title or description");
    }
  }

  return parsed as GeneratePlanResult;
}
