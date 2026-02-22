import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters, storyPages, stories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { extractCharacters } from "@/lib/ai/generate-character";
import { generateId } from "@/lib/utils";

// GET /api/stories/[id]/characters
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const chars = await db
    .select()
    .from(characters)
    .where(eq(characters.storyId, id));

  return NextResponse.json(chars);
}

// POST /api/stories/[id]/characters — Extract characters from story text
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const pages = await db
    .select()
    .from(storyPages)
    .where(eq(storyPages.storyId, id))
    .orderBy(storyPages.pageNumber);

  if (pages.length === 0) {
    return NextResponse.json(
      { error: "No pages found. Generate text first." },
      { status: 400 }
    );
  }

  try {
    const extracted = await extractCharacters(
      pages.map((p) => ({ title: p.title, text: p.text }))
    );

    // Delete existing characters
    await db.delete(characters).where(eq(characters.storyId, id));

    const now = new Date().toISOString();
    const created = [];

    for (const char of extracted) {
      const charId = generateId();
      await db.insert(characters).values({
        id: charId,
        storyId: id,
        name: char.name,
        description: char.description,
        isUploaded: false,
        createdAt: now,
      });
      created.push({
        id: charId,
        storyId: id,
        name: char.name,
        description: char.description,
        referenceImagePath: null,
        isUploaded: false,
        createdAt: now,
      });
    }

    // Update story status
    await db
      .update(stories)
      .set({ status: "characters_ready", updatedAt: now })
      .where(eq(stories.id, id));

    return NextResponse.json(created);
  } catch (error) {
    console.error("Character extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract characters" },
      { status: 500 }
    );
  }
}
