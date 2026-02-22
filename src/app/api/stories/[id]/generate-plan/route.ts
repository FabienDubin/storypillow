import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generatePlan } from "@/lib/ai/generate-plan";

// POST /api/stories/[id]/generate-plan
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = await db.select().from(stories).where(eq(stories.id, id)).get();
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  try {
    const result = await generatePlan({
      theme: story.theme,
      setting: story.setting,
      tone: story.tone,
      moral: story.moral,
      duration: story.duration,
      childName: story.childName,
      context: story.context || "",
    });

    await db
      .update(stories)
      .set({
        title: result.title,
        plan: JSON.stringify(result.plan),
        status: "plan_ready",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(stories.id, id));

    return NextResponse.json({
      title: result.title,
      plan: result.plan,
    });
  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan. Please check your API key." },
      { status: 500 }
    );
  }
}
