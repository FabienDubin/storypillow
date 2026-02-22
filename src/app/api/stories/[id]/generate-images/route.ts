import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories, storyPages, characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateIllustration } from "@/lib/ai/generate-illustration";
import fs from "fs";
import path from "path";

// POST /api/stories/[id]/generate-images — Generate all illustrations
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
    return NextResponse.json({ error: "No pages found" }, { status: 404 });
  }

  // Load character reference images
  const chars = await db
    .select()
    .from(characters)
    .where(eq(characters.storyId, id));

  const referenceImages: { mimeType: string; data: string }[] = [];
  for (const char of chars) {
    if (char.referenceImagePath) {
      const absPath = path.resolve(process.cwd(), char.referenceImagePath.replace(/^\//, ""));
      if (fs.existsSync(absPath)) {
        const data = fs.readFileSync(absPath).toString("base64");
        const ext = path.extname(absPath).toLowerCase();
        const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
        referenceImages.push({ mimeType, data });
      }
    }
  }

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
  } else {
    await db
      .update(stories)
      .set({ status: "images_ready", updatedAt: new Date().toISOString() })
      .where(eq(stories.id, id));
  }

  return NextResponse.json({ results });
}
