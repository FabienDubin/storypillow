import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories, storyPages, users } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";
import { desc, eq, sql } from "drizzle-orm";
import { createStorySchema, parseBody } from "@/lib/validations";
import { getVerifiedSession } from "@/lib/auth/session";

// GET /api/stories — List all stories with creator name and first page image
export async function GET() {
  const allStories = db
    .select({
      id: stories.id,
      title: stories.title,
      theme: stories.theme,
      setting: stories.setting,
      tone: stories.tone,
      moral: stories.moral,
      duration: stories.duration,
      childName: stories.childName,
      context: stories.context,
      plan: stories.plan,
      status: stories.status,
      createdBy: stories.createdBy,
      createdAt: stories.createdAt,
      updatedAt: stories.updatedAt,
      creatorName: users.name,
      coverImage: sql<string | null>`(
        SELECT ${storyPages.imagePath} FROM ${storyPages}
        WHERE ${storyPages.storyId} = ${stories.id}
        ORDER BY ${storyPages.pageNumber} ASC
        LIMIT 1
      )`,
    })
    .from(stories)
    .leftJoin(users, eq(stories.createdBy, users.id))
    .orderBy(desc(stories.createdAt))
    .all();

  const mapped = allStories.map((s) => ({
    ...s,
    plan: s.plan ? (() => { try { return JSON.parse(s.plan); } catch { return null; } })() : null,
  }));

  return NextResponse.json(mapped);
}

// POST /api/stories — Create a new story
export async function POST(request: NextRequest) {
  const session = await getVerifiedSession();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(createStorySchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const id = generateId();
  const now = new Date().toISOString();

  db.insert(stories).values({
    id,
    title: "",
    createdBy: session?.userId ?? null,
    theme: parsed.data.theme,
    setting: parsed.data.setting,
    tone: parsed.data.tone,
    moral: parsed.data.moral,
    duration: parsed.data.duration,
    childName: parsed.data.childName,
    context: parsed.data.context || "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  }).run();

  return NextResponse.json({ id }, { status: 201 });
}
