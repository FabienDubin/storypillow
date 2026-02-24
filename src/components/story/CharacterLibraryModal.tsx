"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { LibraryCharacter } from "@/types";

interface CharacterLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (libraryCharacter: LibraryCharacter) => void;
}

export default function CharacterLibraryModal({
  open,
  onClose,
  onSelect,
}: CharacterLibraryModalProps) {
  const [libraryChars, setLibraryChars] = useState<LibraryCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError("");
      fetch("/api/characters/library")
        .then((r) => r.json())
        .then((data) => setLibraryChars(data))
        .catch(() => setError("Erreur de chargement"))
        .finally(() => setLoading(false));
    }
  }, [open]);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce personnage de la bibliothèque ?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/characters/library/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Erreur lors de la suppression");
        return;
      }
      setLibraryChars((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Erreur serveur");
    } finally {
      setDeletingId(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] mx-4 bg-navy-light border border-purple/30 rounded-2xl shadow-2xl shadow-purple/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple/20">
          <div>
            <h2 className="text-xl font-bold text-cream font-sans">
              Bibliothèque de personnages
            </h2>
            <p className="text-cream/50 text-sm font-sans mt-0.5">
              Sélectionnez un personnage existant
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors p-1 cursor-pointer"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl px-4 py-2.5 text-sm mb-4">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full mx-auto mb-3" />
              <p className="text-cream/50 font-sans text-sm">Chargement...</p>
            </div>
          ) : libraryChars.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">📚</span>
              <p className="text-cream/50 font-sans">
                Aucun personnage dans la bibliothèque.
              </p>
              <p className="text-cream/30 font-sans text-sm mt-1">
                Générez des images de personnages puis ajoutez-les
                à la bibliothèque.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {libraryChars.map((libChar) => (
                <div
                  key={libChar.id}
                  className="group bg-navy/60 border border-purple/20 rounded-xl p-4 hover:border-gold/30 transition-all duration-200"
                >
                  {/* Image */}
                  <div className="w-full aspect-square bg-navy/40 rounded-lg overflow-hidden mb-3 border border-purple/10">
                    {libChar.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/images/${libChar.imagePath.replace(/^\//, "")}`}
                        alt={libChar.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl">👤</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <h3 className="font-sans font-semibold text-cream text-sm mb-1 truncate">
                    {libChar.name}
                  </h3>
                  <p className="text-cream/40 text-xs font-sans line-clamp-2 mb-3">
                    {libChar.description}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onSelect(libChar)}
                    >
                      Utiliser
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(libChar.id)}
                      loading={deletingId === libChar.id}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
