import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories, storyPages, characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/stories/[id] — Get story details with pages and characters
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = await db.select().from(stories).where(eq(stories.id, id)).get();

  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const pages = await db
    .select()
    .from(storyPages)
    .where(eq(storyPages.storyId, id))
    .orderBy(storyPages.pageNumber);

  const chars = await db
    .select()
    .from(characters)
    .where(eq(characters.storyId, id));

  return NextResponse.json({
    ...story,
    plan: story.plan ? JSON.parse(story.plan) : null,
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
  const body = await request.json();

  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.title !== undefined) updateData.title = body.title;
  if (body.theme !== undefined) updateData.theme = body.theme;
  if (body.setting !== undefined) updateData.setting = body.setting;
  if (body.tone !== undefined) updateData.tone = body.tone;
  if (body.moral !== undefined) updateData.moral = body.moral;
  if (body.duration !== undefined) updateData.duration = body.duration;
  if (body.childName !== undefined) updateData.childName = body.childName;
  if (body.context !== undefined) updateData.context = body.context;
  if (body.plan !== undefined)
    updateData.plan = JSON.stringify(body.plan);
  if (body.status !== undefined) updateData.status = body.status;

  await db.update(stories).set(updateData).where(eq(stories.id, id));

  return NextResponse.json({ success: true });
}

// DELETE /api/stories/[id] — Delete story
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.delete(stories).where(eq(stories.id, id));

  return NextResponse.json({ success: true });
}
