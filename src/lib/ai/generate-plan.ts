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

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse plan response from AI");
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratePlanResult;

  if (!parsed.title || !Array.isArray(parsed.plan)) {
    throw new Error("Invalid plan structure from AI");
  }

  return parsed;
}
