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

  const chars = db
    .select()
    .from(characters)
    .where(eq(characters.storyId, id))
    .all();

  return NextResponse.json(chars);
}

// POST /api/stories/[id]/characters — Extract characters from story text
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = db.select().from(stories).where(eq(stories.id, id)).get();
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  if (story.status !== "text_ready" && story.status !== "characters_ready") {
    return NextResponse.json(
      { error: "Les personnages ne peuvent être extraits qu'après génération du texte." },
      { status: 400 }
    );
  }

  const pages = db
    .select()
    .from(storyPages)
    .where(eq(storyPages.storyId, id))
    .orderBy(storyPages.pageNumber)
    .all();

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

    const now = new Date().toISOString();
    const created: Array<{
      id: string;
      storyId: string;
      name: string;
      description: string;
      referenceImagePath: string | null;
      isUploaded: boolean;
      createdAt: string;
    }> = [];

    // Use a transaction for atomic character replacement (sync for better-sqlite3)
    db.transaction((tx) => {
      tx.delete(characters).where(eq(characters.storyId, id)).run();

      for (const char of extracted) {
        const charId = generateId();
        tx.insert(characters).values({
          id: charId,
          storyId: id,
          name: char.name,
          description: char.description,
          isUploaded: false,
          createdAt: now,
        }).run();
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

      tx
        .update(stories)
        .set({ status: "characters_ready", updatedAt: now })
        .where(eq(stories.id, id))
        .run();
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Character extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract characters" },
      { status: 500 }
    );
  }
}
