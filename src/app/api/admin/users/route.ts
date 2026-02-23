import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return null;
  }
  return session;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const users = db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
    })
    .from(schema.users)
    .all();

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, nom et mot de passe requis" },
        { status: 400 }
      );
    }

    const validRole = role === "admin" ? "admin" : "user";

    // Check if email already exists
    const existing = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);
    const id = uuid();

    db.insert(schema.users)
      .values({
        id,
        email: email.toLowerCase().trim(),
        name,
        passwordHash,
        role: validRole,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return NextResponse.json(
      {
        user: { id, email: email.toLowerCase().trim(), name, role: validRole, createdAt: now, updatedAt: now },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
