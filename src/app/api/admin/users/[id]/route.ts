import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { hashPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updates: Record<string, string> = {};

    if (body.name) updates.name = body.name;
    if (body.email) updates.email = body.email.toLowerCase().trim();
    if (body.role && (body.role === "admin" || body.role === "user")) {
      // Prevent admin from demoting themselves
      if (admin.userId === id && body.role !== "admin") {
        return NextResponse.json(
          { error: "Impossible de modifier votre propre rôle" },
          { status: 400 }
        );
      }
      updates.role = body.role;
    }
    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 8 caractères" },
          { status: 400 }
        );
      }
      updates.passwordHash = await hashPassword(body.password);
      updates.passwordChangedAt = new Date().toISOString();
    }

    updates.updatedAt = new Date().toISOString();

    db.update(schema.users).set(updates).where(eq(schema.users.id, id)).run();

    const user = db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .get();

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent deleting yourself
  if (admin.userId === id) {
    return NextResponse.json(
      { error: "Impossible de supprimer votre propre compte" },
      { status: 400 }
    );
  }

  db.delete(schema.users).where(eq(schema.users.id, id)).run();

  return NextResponse.json({ ok: true });
}
