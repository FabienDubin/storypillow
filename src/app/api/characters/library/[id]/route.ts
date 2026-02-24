import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characterLibrary } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

// DELETE /api/characters/library/[id] — Remove from library
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const libChar = await db
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

  await db.delete(characterLibrary).where(eq(characterLibrary.id, id));

  return NextResponse.json({ success: true });
}

// PUT /api/characters/library/[id] — Update library character
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const libChar = await db
    .select()
    .from(characterLibrary)
    .where(eq(characterLibrary.id, id))
    .get();

  if (!libChar) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.description) updateData.description = body.description;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(characterLibrary)
      .set(updateData)
      .where(eq(characterLibrary.id, id));
  }

  return NextResponse.json({ success: true });
}
