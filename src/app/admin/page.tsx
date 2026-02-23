"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import StarField from "@/components/ui/StarField";
import Header from "@/components/ui/Header";

interface UserEntry {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Edit user
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"user" | "admin">("user");
  const [editPassword, setEditPassword] = useState("");

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Erreur");
        return;
      }

      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewRole("user");
      setShowForm(false);
      loadUsers();
    } catch {
      setFormError("Erreur serveur");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Supprimer le compte de ${email} ?`)) return;

    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    loadUsers();
  }

  async function handleUpdate(id: string) {
    const body: Record<string, string> = {
      name: editName,
      role: editRole,
    };
    if (editPassword) body.password = editPassword;

    await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setEditingId(null);
    setEditPassword("");
    loadUsers();
  }

  function startEdit(user: UserEntry) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditRole(user.role as "user" | "admin");
    setEditPassword("");
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen relative">
      <StarField count={30} />
      <Header />

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-cream font-sans">
              Gestion des comptes
            </h1>
            <p className="text-cream/60 text-sm mt-1">
              {users.length} utilisateur{users.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-xl font-sans font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 bg-gold text-navy hover:bg-gold-light shadow-lg shadow-gold/20 px-5 py-2.5 text-base cursor-pointer"
          >
            {showForm ? "Annuler" : "+ Nouveau compte"}
          </button>
        </div>

        {/* Create user form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-navy-light/60 border border-purple/30 rounded-2xl p-6 backdrop-blur-sm mb-6"
          >
            <h2 className="text-lg font-bold text-cream font-sans mb-4">
              Créer un compte
            </h2>

            {formError && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl px-4 py-2.5 text-sm mb-4">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
                  Nom
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full bg-navy border border-purple/30 text-cream rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 placeholder-cream/30"
                />
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full bg-navy border border-purple/30 text-cream rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 placeholder-cream/30"
                />
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-navy border border-purple/30 text-cream rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 placeholder-cream/30"
                />
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
                  Rôle
                </label>
                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value as "user" | "admin")
                  }
                  className="w-full bg-navy border border-purple/30 text-cream rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="inline-flex items-center justify-center rounded-xl font-sans font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 bg-gold text-navy hover:bg-gold-light shadow-lg shadow-gold/20 px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {formLoading ? "Création..." : "Créer le compte"}
            </button>
          </form>
        )}

        {/* Users list */}
        {loading ? (
          <div className="text-center text-cream/60 py-12">Chargement...</div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-navy-light/40 border border-purple/20 rounded-xl p-4 backdrop-blur-sm"
              >
                {editingId === user.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-sans text-cream/60 mb-1">
                          Nom
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-navy border border-purple/30 text-cream rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-sans text-cream/60 mb-1">
                          Nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Laisser vide pour ne pas changer"
                          className="w-full bg-navy border border-purple/30 text-cream rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder-cream/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-sans text-cream/60 mb-1">
                          Rôle
                        </label>
                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as "user" | "admin")
                          }
                          className="w-full bg-navy border border-purple/30 text-cream rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                        >
                          <option value="user">Utilisateur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(user.id)}
                        className="rounded-lg font-sans font-semibold text-sm px-4 py-1.5 bg-gold text-navy hover:bg-gold-light transition-colors cursor-pointer"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg font-sans text-sm px-4 py-1.5 text-cream/70 hover:text-cream hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple/30 flex items-center justify-center text-cream font-sans font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-cream font-sans font-semibold text-sm">
                            {user.name}
                          </span>
                          <span
                            className={`text-xs font-sans px-2 py-0.5 rounded-full ${
                              user.role === "admin"
                                ? "bg-gold/20 text-gold"
                                : "bg-purple/20 text-purple-light"
                            }`}
                          >
                            {user.role === "admin"
                              ? "Admin"
                              : "Utilisateur"}
                          </span>
                        </div>
                        <div className="text-cream/50 text-xs font-sans">
                          {user.email} — Créé le{" "}
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="text-cream/60 hover:text-cream text-sm font-sans px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-red-400/70 hover:text-red-400 text-sm font-sans px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
