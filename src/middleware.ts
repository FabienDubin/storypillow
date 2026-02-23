import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "sp_session";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function base64urlDecode(str: string): Uint8Array {
  // Pad the string
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyTokenEdge(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [header, body, sig] = parts;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBuffer = base64urlDecode(sig);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      encoder.encode(`${header}.${body}`)
    );

    if (!valid) return false;

    // Check expiration
    const payloadJson = new TextDecoder().decode(base64urlDecode(body));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return redirectToLogin(request);
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return redirectToLogin(request);
  }

  const valid = await verifyTokenEdge(token, secret);
  if (!valid) {
    return redirectToLogin(request);
  }

  // For admin routes, check role from token
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    try {
      const body = token.split(".")[1];
      const payloadJson = new TextDecoder().decode(base64urlDecode(body));
      const payload = JSON.parse(payloadJson);
      if (payload.role !== "admin") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return redirectToLogin(request);
    }
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
