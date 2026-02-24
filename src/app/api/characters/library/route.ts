import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters, characterLibrary } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// GET /api/characters/library — List all library characters
export async function GET() {
  const libraryChars = await db
    .select()
    .from(characterLibrary)
    .orderBy(characterLibrary.name);

  return NextResponse.json(libraryChars);
}

// POST /api/characters/library — Add a story character to the library
export async function POST(request: NextRequest) {
  let body: { characterId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.characterId) {
    return NextResponse.json(
      { error: "characterId is required" },
      { status: 400 }
    );
  }

  const character = await db
    .select()
    .from(characters)
    .where(eq(characters.id, body.characterId))
    .get();

  if (!character) {
    return NextResponse.json(
      { error: "Character not found" },
      { status: 404 }
    );
  }

  if (!character.referenceImagePath) {
    return NextResponse.json(
      { error: "Character has no reference image" },
      { status: 400 }
    );
  }

  // Copy image to library directory
  const sourcePath = path.resolve(
    process.cwd(),
    character.referenceImagePath.replace(/^\//, "")
  );

  if (!fs.existsSync(sourcePath)) {
    return NextResponse.json(
      { error: "Source image file not found" },
      { status: 400 }
    );
  }

  const libraryId = crypto.randomUUID();
  const ext = path.extname(sourcePath) || ".png";
  const libraryDir = path.resolve(process.cwd(), "library");
  if (!fs.existsSync(libraryDir)) {
    fs.mkdirSync(libraryDir, { recursive: true });
  }

  const destFilename = `char_${libraryId}${ext}`;
  const destPath = path.join(libraryDir, destFilename);
  fs.copyFileSync(sourcePath, destPath);

  const imagePath = `/library/${destFilename}`;

  await db.insert(characterLibrary).values({
    id: libraryId,
    name: character.name,
    description: character.description,
    imagePath,
    sourceStoryId: character.storyId,
  });

  const created = await db
    .select()
    .from(characterLibrary)
    .where(eq(characterLibrary.id, libraryId))
    .get();

  return NextResponse.json(created);
}
