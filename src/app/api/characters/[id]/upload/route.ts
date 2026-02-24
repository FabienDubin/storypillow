import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

// POST /api/characters/[id]/upload — Upload reference image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const character = db
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

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const dir = path.resolve(process.cwd(), "uploads", character.storyId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const ext = path.extname(file.name) || ".png";
  const filename = `char_${id}_${Date.now()}${ext}`;
  const filePath = path.join(dir, filename);

  // Clean up old uploaded images for this character
  const existing = fs.readdirSync(dir).filter((f) => f.startsWith(`char_${id}`) && f !== filename);
  for (const old of existing) {
    fs.unlinkSync(path.join(dir, old));
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const imagePath = `/uploads/${character.storyId}/${filename}`;

  db.update(characters)
    .set({ referenceImagePath: imagePath, isUploaded: true })
    .where(eq(characters.id, id))
    .run();

  return NextResponse.json({ imagePath });
}
