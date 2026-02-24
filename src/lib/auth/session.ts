import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "@/types";

const SESSION_COOKIE = "sp_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecretKey());
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as "admin" | "user",
      passwordChangedAt: payload.passwordChangedAt as string,
    };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

/** Decode token from cookie (no DB check — use getVerifiedSession for full validation) */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Decode token AND verify against DB that user still exists
 * and password hasn't changed since token was issued.
 * Use this in API routes for full session validation.
 */
export async function getVerifiedSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;

  // Lazy import to avoid circular dependency
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");

  const user = db
    .select({
      id: schema.users.id,
      passwordChangedAt: schema.users.passwordChangedAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .get();

  // User deleted
  if (!user) return null;

  // Password was changed after token was issued
  if (user.passwordChangedAt !== session.passwordChangedAt) return null;

  return session;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
