import { cookies } from "next/headers";
import type { SessionPayload } from "@/types";

const SESSION_COOKIE = "sp_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return secret;
}

// Encode payload to base64url
function base64url(data: string): string {
  return Buffer.from(data).toString("base64url");
}

// Decode base64url to string
function fromBase64url(data: string): string {
  return Buffer.from(data, "base64url").toString();
}

// Create HMAC signature using Web Crypto API compatible approach
async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  return Buffer.from(signature).toString("base64url");
}

// Verify HMAC signature
async function verify(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBuffer = Buffer.from(signature, "base64url");
  return crypto.subtle.verify(
    "HMAC",
    key,
    sigBuffer,
    encoder.encode(data)
  );
}

interface TokenPayload extends SessionPayload {
  exp: number;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  const secret = getSecret();
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const tokenPayload: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  };
  const body = base64url(JSON.stringify(tokenPayload));
  const data = `${header}.${body}`;
  const sig = await sign(data, secret);
  return `${data}.${sig}`;
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;

    const valid = await verify(`${header}.${body}`, sig, secret);
    if (!valid) return null;

    const payload: TokenPayload = JSON.parse(fromBase64url(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
