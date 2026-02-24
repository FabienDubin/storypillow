import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters, characterLibrary } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

// POST /api/characters/[id]/use-library — Apply a library character to a story character
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { libraryCharacterId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.libraryCharacterId) {
    return NextResponse.json(
      { error: "libraryCharacterId is required" },
      { status: 400 }
    );
  }

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

  const libChar = await db
    .select()
    .from(characterLibrary)
    .where(eq(characterLibrary.id, body.libraryCharacterId))
    .get();

  if (!libChar) {
    return NextResponse.json(
      { error: "Library character not found" },
      { status: 404 }
    );
  }

  if (!libChar.imagePath) {
    return NextResponse.json(
      { error: "Library character has no image" },
      { status: 400 }
    );
  }

  // Copy image from library to story's generated directory
  const sourcePath = path.resolve(
    process.cwd(),
    libChar.imagePath.replace(/^\//, "")
  );

  if (!fs.existsSync(sourcePath)) {
    return NextResponse.json(
      { error: "Library image file not found" },
      { status: 400 }
    );
  }

  const storyDir = path.resolve(
    process.cwd(),
    "generated",
    character.storyId
  );
  if (!fs.existsSync(storyDir)) {
    fs.mkdirSync(storyDir, { recursive: true });
  }

  const ext = path.extname(sourcePath) || ".png";
  const destFilename = `char_${id}${ext}`;
  const destPath = path.join(storyDir, destFilename);
  fs.copyFileSync(sourcePath, destPath);

  const imagePath = `/generated/${character.storyId}/${destFilename}`;

  await db
    .update(characters)
    .set({
      referenceImagePath: imagePath,
      description: libChar.description,
      isUploaded: false,
      libraryCharacterId: libChar.id,
    })
    .where(eq(characters.id, id));

  return NextResponse.json({
    imagePath,
    description: libChar.description,
    libraryCharacterId: libChar.id,
  });
}
