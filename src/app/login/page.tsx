"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import StarField from "@/components/ui/StarField";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur de connexion");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <StarField count={40} />
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <span className="text-5xl" role="img" aria-label="moon">
            🌙
          </span>
          <h1 className="text-2xl font-bold text-cream mt-4 font-sans">
            Storypillow
          </h1>
          <p className="text-cream/60 text-sm mt-1">
            Connexion à votre espace
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-navy-light/60 border border-purple/30 rounded-2xl p-6 backdrop-blur-sm"
        >
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl px-4 py-2.5 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoFocus
              className="w-full bg-navy border border-purple/30 text-cream rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 placeholder-cream/30"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-navy border border-purple/30 text-cream rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 placeholder-cream/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl font-sans font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 bg-gold text-navy hover:bg-gold-light shadow-lg shadow-gold/20 px-5 py-2.5 text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <svg
                  className="spinner -ml-1 mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
