import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storyPages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updatePageSchema, parseBody } from "@/lib/validations";

// PUT /api/stories/[id]/pages/[pageId] — Update a page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { id, pageId } = await params;

  const page = await db
    .select()
    .from(storyPages)
    .where(and(eq(storyPages.id, pageId), eq(storyPages.storyId, id)))
    .get();

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(updatePageSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.text !== undefined) updateData.text = parsed.data.text;
  if (parsed.data.imagePrompt !== undefined) updateData.imagePrompt = parsed.data.imagePrompt;
  if (parsed.data.imagePath !== undefined) updateData.imagePath = parsed.data.imagePath;

  await db.update(storyPages).set(updateData).where(eq(storyPages.id, pageId));

  return NextResponse.json({ success: true });
}
