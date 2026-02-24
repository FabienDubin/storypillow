import { getVerifiedSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/types";

export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getVerifiedSession();
  if (!session || session.role !== "admin") {
    return null;
  }
  return session;
}
