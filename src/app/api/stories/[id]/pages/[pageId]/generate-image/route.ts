import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storyPages, characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateIllustration } from "@/lib/ai/generate-illustration";
import fs from "fs";
import path from "path";

// POST /api/stories/[id]/pages/[pageId]/generate-image
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { id, pageId } = await params;

  const page = await db
    .select()
    .from(storyPages)
    .where(eq(storyPages.id, pageId))
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
