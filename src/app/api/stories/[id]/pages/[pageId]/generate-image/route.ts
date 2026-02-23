import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storyPages, characters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateIllustration } from "@/lib/ai/generate-illustration";
import { loadReferenceImages } from "@/lib/utils/load-reference-images";

// POST /api/stories/[id]/pages/[pageId]/generate-image
export async function POST(
  _request: NextRequest,
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

  if (!page.imagePrompt) {
    return NextResponse.json(
      { error: "No image prompt set for this page" },
      { status: 400 }
    );
  }

  // Load character reference images safely
  const chars = await db
    .select()
    .from(characters)
    .where(eq(characters.storyId, id));

  const referenceImages = loadReferenceImages(chars);

  try {
    const imagePath = await generateIllustration(
      page.imagePrompt,
      id,
      pageId,
      referenceImages
    );

    await db
      .update(storyPages)
      .set({ imagePath })
      .where(eq(storyPages.id, pageId));

    return NextResponse.json({ imagePath });
  } catch (error) {
    console.error("Illustration generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate illustration" },
      { status: 500 }
    );
  }
}
