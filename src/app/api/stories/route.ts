import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";
import { desc } from "drizzle-orm";

// GET /api/stories — List all stories
export async function GET() {
  const allStories = await db
    .select()
    .from(stories)
    .orderBy(desc(stories.createdAt));

  const mapped = allStories.map((s) => ({
    ...s,
    plan: s.plan ? JSON.parse(s.plan) : null,
  }));

  return NextResponse.json(mapped);
}

// POST /api/stories — Create a new story
export async function POST(request: NextRequest) {
  const body = await request.json();

  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(stories).values({
    id,
    title: "",
    theme: body.theme,
    setting: body.setting,
    tone: body.tone,
    moral: body.moral,
    duration: body.duration,
    childName: body.childName,
    context: body.context || "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
