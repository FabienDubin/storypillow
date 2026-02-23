import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";
import { desc } from "drizzle-orm";
import { createStorySchema, parseBody } from "@/lib/validations";

// GET /api/stories — List all stories
export async function GET() {
  const allStories = await db
    .select()
    .from(stories)
    .orderBy(desc(stories.createdAt));

  const mapped = allStories.map((s) => ({
    ...s,
    plan: s.plan ? (() => { try { return JSON.parse(s.plan); } catch { return null; } })() : null,
  }));

  return NextResponse.json(mapped);
}

// POST /api/stories — Create a new story
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(createStorySchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(stories).values({
    id,
    title: "",
    theme: parsed.data.theme,
    setting: parsed.data.setting,
    tone: parsed.data.tone,
    moral: parsed.data.moral,
    duration: parsed.data.duration,
    childName: parsed.data.childName,
    context: parsed.data.context || "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
