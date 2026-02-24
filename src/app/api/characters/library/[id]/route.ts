import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characterLibrary } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateLibraryCharacterSchema, parseBody } from "@/lib/validations";
import fs from "fs";
import path from "path";

// DELETE /api/characters/library/[id] — Remove from library
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const libChar = db
    .select()
    .from(characterLibrary)
    .where(eq(characterLibrary.id, id))
    .get();

  if (!libChar) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete image file
  if (libChar.imagePath) {
    const filePath = path.resolve(
      process.cwd(),
      libChar.imagePath.replace(/^\//, "")
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  db.delete(characterLibrary).where(eq(characterLibrary.id, id)).run();

  return NextResponse.json({ ok: true });
}

// PUT /api/characters/library/[id] — Update library character
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const libChar = db
    .select()
    .from(characterLibrary)
    .where(eq(characterLibrary.id, id))
    .get();

  if (!libChar) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(updateLibraryCharacterSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.description) updateData.description = parsed.data.description;

  if (Object.keys(updateData).length > 0) {
    db.update(characterLibrary)
      .set(updateData)
      .where(eq(characterLibrary.id, id))
      .run();
  }

  return NextResponse.json({ ok: true });
}
