import { z } from "zod";

const VALID_STATUSES = [
  "draft",
  "plan_ready",
  "text_ready",
  "characters_ready",
  "images_ready",
  "complete",
] as const;

export const createStorySchema = z.object({
  theme: z.string().min(1),
  setting: z.string().min(1),
  tone: z.string().min(1),
  moral: z.string().min(1),
  duration: z.number().int().refine((v) => [5, 10, 15].includes(v), {
    message: "Duration must be 5, 10, or 15",
  }),
  childName: z.string().min(1),
  context: z.string().optional().default(""),
});

export const updateStorySchema = z.object({
  title: z.string().optional(),
  theme: z.string().optional(),
  setting: z.string().optional(),
  tone: z.string().optional(),
  moral: z.string().optional(),
  duration: z.number().int().optional(),
  childName: z.string().optional(),
  context: z.string().optional(),
  plan: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .optional(),
  status: z.enum(VALID_STATUSES).optional(),
});

export const updatePageSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  imagePrompt: z.string().optional(),
  imagePath: z.string().optional(),
});

export const updateCharacterSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false as const, error: result.error.issues[0].message };
  }
  return { success: true as const, data: result.data };
}
