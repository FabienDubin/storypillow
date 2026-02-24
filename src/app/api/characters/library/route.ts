import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters, characterLibrary } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { addToLibrarySchema, parseBody } from "@/lib/validations";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// GET /api/characters/library — List all library characters
export async function GET() {
  const libraryChars = db
    .select()
    .from(characterLibrary)
    .orderBy(characterLibrary.name)
    .all();

  return NextResponse.json(libraryChars);
}

// POST /api/characters/library — Add a story character to the library
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = parseBody(addToLibrarySchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const character = db
      .select()
      .from(characters)
      .where(eq(characters.id, parsed.data.characterId))
      .get();

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // Check for duplicate
    const existing = db
      .select()
      .from(characterLibrary)
      .where(
        and(
          eq(characterLibrary.name, character.name),
          eq(characterLibrary.sourceStoryId, character.storyId)
        )
      )
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "Ce personnage est déjà dans la bibliothèque" },
        { status: 409 }
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
        { error: "Fichier image source introuvable" },
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

    db.insert(characterLibrary)
      .values({
        id: libraryId,
        name: character.name,
        description: character.description,
        imagePath,
        sourceStoryId: character.storyId,
      })
      .run();

    const created = db
      .select()
      .from(characterLibrary)
      .where(eq(characterLibrary.id, libraryId))
      .get();

    return NextResponse.json(created);
  } catch (err) {
    console.error("Error saving to library:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
