"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/types";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<SessionPayload | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="relative z-10 border-b border-purple/20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-3xl" role="img" aria-label="moon">
            🌙
          </span>
          <span className="text-xl font-bold text-cream group-hover:text-gold transition-colors font-sans">
            Storypillow
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm font-sans text-cream/60 hover:text-gold transition-colors"
              >
                Comptes
              </Link>
            )}
            <span className="text-sm font-sans text-cream/50">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-sans text-cream/50 hover:text-cream transition-colors cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
