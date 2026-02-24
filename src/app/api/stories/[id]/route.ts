import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories, storyPages, characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateStorySchema, parseBody } from "@/lib/validations";

// GET /api/stories/[id] — Get story details with pages and characters
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = db.select().from(stories).where(eq(stories.id, id)).get();

  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const pages = db
    .select()
    .from(storyPages)
    .where(eq(storyPages.storyId, id))
    .orderBy(storyPages.pageNumber)
    .all();

  const chars = db
    .select()
    .from(characters)
    .where(eq(characters.storyId, id))
    .all();

  let plan = null;
  try {
    plan = story.plan ? JSON.parse(story.plan) : null;
  } catch {
    plan = null;
  }

  return NextResponse.json({
    ...story,
    plan,
    pages,
    characters: chars,
  });
}

// PUT /api/stories/[id] — Update story
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = db.select().from(stories).where(eq(stories.id, id)).get();
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(updateStorySchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.theme !== undefined) updateData.theme = parsed.data.theme;
  if (parsed.data.setting !== undefined) updateData.setting = parsed.data.setting;
  if (parsed.data.tone !== undefined) updateData.tone = parsed.data.tone;
  if (parsed.data.moral !== undefined) updateData.moral = parsed.data.moral;
  if (parsed.data.duration !== undefined) updateData.duration = parsed.data.duration;
  if (parsed.data.childName !== undefined) updateData.childName = parsed.data.childName;
  if (parsed.data.context !== undefined) updateData.context = parsed.data.context;
  if (parsed.data.plan !== undefined)
    updateData.plan = JSON.stringify(parsed.data.plan);
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  db.update(stories).set(updateData).where(eq(stories.id, id)).run();

  return NextResponse.json({ success: true });
}

// DELETE /api/stories/[id] — Delete story
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = db.select().from(stories).where(eq(stories.id, id)).get();
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  db.delete(stories).where(eq(stories.id, id)).run();

  return NextResponse.json({ success: true });
}
