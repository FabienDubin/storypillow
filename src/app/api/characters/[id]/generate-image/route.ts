import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateCharacterImage } from "@/lib/ai/generate-character";

// POST /api/characters/[id]/generate-image
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const character = await db
    .select()
    .from(characters)
    .where(eq(characters.id, id))
    .get();

  if (!character) {
    return NextResponse.json(
      { error: "Character not found" },
      { status: 404 }
    );
  }

  try {
    const imagePath = await generateCharacterImage(
      { name: character.name, description: character.description },
      character.storyId,
      character.id
    );

    await db
      .update(characters)
      .set({ referenceImagePath: imagePath, isUploaded: false })
      .where(eq(characters.id, id));

    return NextResponse.json({ imagePath });
  } catch (error) {
    console.error("Character image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate character image" },
      { status: 500 }
    );
  }
}
