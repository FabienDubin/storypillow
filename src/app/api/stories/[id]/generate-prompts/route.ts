import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories, storyPages, characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateImagePrompts } from "@/lib/ai/generate-illustration";

// POST /api/stories/[id]/generate-prompts — Generate illustration prompts via AI
export async function POST(
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

  if (pages.length === 0) {
    return NextResponse.json({ error: "No pages found" }, { status: 400 });
  }

  const chars = db
    .select()
    .from(characters)
    .where(eq(characters.storyId, id))
    .all();

  try {
    const prompts = await generateImagePrompts(
      pages.map((p) => ({ title: p.title, text: p.text })),
      chars.map((c) => ({ name: c.name, description: c.description }))
    );

    // Save prompts to pages
    for (let i = 0; i < pages.length && i < prompts.length; i++) {
      db
        .update(storyPages)
        .set({ imagePrompt: prompts[i] })
        .where(eq(storyPages.id, pages[i].id))
        .run();
    }

    // Return updated pages
    const updatedPages = db
      .select()
      .from(storyPages)
      .where(eq(storyPages.storyId, id))
      .orderBy(storyPages.pageNumber)
      .all();

    return NextResponse.json({ pages: updatedPages });
  } catch (error) {
    console.error("Prompt generation error:", error);
    return NextResponse.json(
      { error: "Échec de la génération des prompts." },
      { status: 500 }
    );
  }
}
