import { NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getVerifiedSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
