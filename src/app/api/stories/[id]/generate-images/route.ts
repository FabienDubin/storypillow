import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories, storyPages, characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateIllustration } from "@/lib/ai/generate-illustration";
import { loadReferenceImages } from "@/lib/utils/load-reference-images";

// POST /api/stories/[id]/generate-images — Generate all illustrations
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = await db.select().from(stories).where(eq(stories.id, id)).get();
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  if (story.status !== "characters_ready" && story.status !== "images_ready") {
    return NextResponse.json(
      { error: "Les images ne peuvent être générées qu'après la création des personnages." },
      { status: 400 }
    );
  }

  const pages = await db
    .select()
    .from(storyPages)
    .where(eq(storyPages.storyId, id))
    .orderBy(storyPages.pageNumber);

  if (pages.length === 0) {
    return NextResponse.json({ error: "No pages found" }, { status: 404 });
  }

  // Load character reference images safely
  const chars = await db
    .select()
    .from(characters)
    .where(eq(characters.storyId, id));

  const referenceImages = loadReferenceImages(chars);

  const results: { pageId: string; imagePath: string | null; error?: string }[] = [];

  for (const page of pages) {
    if (!page.imagePrompt) {
      results.push({ pageId: page.id, imagePath: null, error: "No prompt" });
      continue;
    }

    try {
      const imagePath = await generateIllustration(
        page.imagePrompt,
        id,
        page.id,
        referenceImages
      );

      await db
        .update(storyPages)
        .set({ imagePath })
        .where(eq(storyPages.id, page.id));

      results.push({ pageId: page.id, imagePath });
    } catch (error) {
      console.error(`Error generating image for page ${page.id}:`, error);
      results.push({
        pageId: page.id,
        imagePath: null,
        error: "Generation failed",
      });
    }
  }

  // Update story status
  const allGenerated = results.every((r) => r.imagePath !== null);
  if (allGenerated) {
    await db
      .update(stories)
      .set({ status: "complete", updatedAt: new Date().toISOString() })
      .where(eq(stories.id, id));
  }

  return NextResponse.json({ results });
}
