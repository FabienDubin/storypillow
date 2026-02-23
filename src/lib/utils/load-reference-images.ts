import fs from "fs";
import path from "path";

const ALLOWED_DIRS = ["uploads", "generated"];

export function loadReferenceImages(
  chars: Array<{ referenceImagePath: string | null }>
): { mimeType: string; data: string }[] {
  const referenceImages: { mimeType: string; data: string }[] = [];
  const cwd = process.cwd();

  for (const char of chars) {
    if (!char.referenceImagePath) continue;

    const relativePath = char.referenceImagePath.replace(/^\//, "");
    const absPath = path.resolve(cwd, relativePath);

    // Validate path stays within allowed directories
    const isAllowed = ALLOWED_DIRS.some((dir) =>
      absPath.startsWith(path.resolve(cwd, dir) + path.sep)
    );
    if (!isAllowed) continue;

    if (!fs.existsSync(absPath)) continue;

    const data = fs.readFileSync(absPath).toString("base64");
    const ext = path.extname(absPath).toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".webp") mimeType = "image/webp";
    else if (ext === ".gif") mimeType = "image/gif";

    referenceImages.push({ mimeType, data });
  }

  return referenceImages;
}
