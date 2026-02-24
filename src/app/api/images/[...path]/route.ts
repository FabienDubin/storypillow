import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// GET /api/images/[...path] — Serve uploaded and generated images
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;
  const relativePath = pathParts.join("/");

  // Only allow serving from uploads/, generated/, and library/ directories
  if (
    !relativePath.startsWith("uploads/") &&
    !relativePath.startsWith("generated/") &&
    !relativePath.startsWith("library/")
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.resolve(process.cwd(), relativePath);

  // Prevent path traversal
  const basePath = path.resolve(process.cwd());
  if (!filePath.startsWith(basePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";
  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
