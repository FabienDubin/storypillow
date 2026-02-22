import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storyPages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PUT /api/stories/[id]/pages/[pageId] — Update a page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { pageId } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.text !== undefined) updateData.text = body.text;
  if (body.imagePrompt !== undefined) updateData.imagePrompt = body.imagePrompt;
  if (body.imagePath !== undefined) updateData.imagePath = body.imagePath;

  await db.update(storyPages).set(updateData).where(eq(storyPages.id, pageId));

  return NextResponse.json({ success: true });
}
