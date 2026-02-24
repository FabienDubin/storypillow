import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories, storyPages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateText } from "@/lib/ai/generate-text";
import { generateId } from "@/lib/utils";

// POST /api/stories/[id]/generate-text
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = db.select().from(stories).where(eq(stories.id, id)).get();
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  if (story.status !== "plan_ready" && story.status !== "text_ready") {
    return NextResponse.json(
      { error: "Le texte ne peut être généré qu'après validation du plan." },
      { status: 400 }
    );
  }

  if (!story.plan) {
    return NextResponse.json(
      { error: "Story plan not found. Generate a plan first." },
      { status: 400 }
    );
  }

  let plan;
  try {
    plan = JSON.parse(story.plan);
  } catch {
    return NextResponse.json(
      { error: "Invalid plan data." },
      { status: 500 }
    );
  }

  try {
    const result = await generateText({
      title: story.title,
      plan,
      theme: story.theme,
      setting: story.setting,
      tone: story.tone,
      moral: story.moral,
      duration: story.duration,
      childName: story.childName,
      context: story.context || "",
    });

    const now = new Date().toISOString();

    // Use a transaction for atomic page replacement (sync for better-sqlite3)
    db.transaction((tx) => {
      tx.delete(storyPages).where(eq(storyPages.storyId, id)).run();

      for (let i = 0; i < result.pages.length; i++) {
        tx.insert(storyPages).values({
          id: generateId(),
          storyId: id,
          pageNumber: i + 1,
          title: result.pages[i].title,
          text: result.pages[i].text,
          createdAt: now,
        }).run();
      }

      tx
        .update(stories)
        .set({
          status: "text_ready",
          updatedAt: now,
        })
        .where(eq(stories.id, id))
        .run();
    });

    // Fetch created pages
    const pages = db
      .select()
      .from(storyPages)
      .where(eq(storyPages.storyId, id))
      .orderBy(storyPages.pageNumber)
      .all();

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Text generation error:", error);
    return NextResponse.json(
      { error: "Échec de la génération du texte." },
      { status: 500 }
    );
  }
}
