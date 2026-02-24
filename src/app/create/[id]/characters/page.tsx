"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import StarField from "@/components/ui/StarField";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StepIndicator from "@/components/story/StepIndicator";
import CharacterLibraryModal from "@/components/story/CharacterLibraryModal";
import type { Character, LibraryCharacter } from "@/types";

const STEP_LABELS = [
  "Thème",
  "Plan",
  "Texte",
  "Personnages",
  "Illustrations",
];

export default function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [savingToLibrary, setSavingToLibrary] = useState<string | null>(null);
  const [savedToLibrary, setSavedToLibrary] = useState<Set<string>>(new Set());
  const [libraryModalFor, setLibraryModalFor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch(`/api/stories/${id}/characters`)
      .then((r) => r.json())
      .then((data) => {
        if (data.length > 0) {
          setCharacters(data);
          setExtracted(true);
        } else {
          handleExtract();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleExtract() {
    setExtracting(true);
    setError("");

    try {
      const res = await fetch(`/api/stories/${id}/characters`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'extraction");
      }

      const data = await res.json();
      setCharacters(data);
      setExtracted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'extraction"
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleGenerateImage(characterId: string) {
    setGeneratingImage(characterId);

    try {
      const res = await fetch(
        `/api/characters/${characterId}/generate-image`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Erreur de génération");

      const data = await res.json();
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId
            ? { ...c, referenceImagePath: data.imagePath, isUploaded: false, libraryCharacterId: null }
            : c
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de génération d'image"
      );
    } finally {
      setGeneratingImage(null);
    }
  }

  async function handleUploadImage(characterId: string, file: File) {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`/api/characters/${characterId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur d'upload");

      const data = await res.json();
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId
            ? { ...c, referenceImagePath: data.imagePath, isUploaded: true, libraryCharacterId: null }
            : c
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur d'upload"
      );
    }
  }

  function handleEditDescription(characterId: string, description: string) {
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId ? { ...c, description } : c
      )
    );
  }

  async function handleSaveDescription(characterId: string, description: string) {
    await fetch(`/api/characters/${characterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
  }

  async function handleSaveToLibrary(characterId: string) {
    setSavingToLibrary(characterId);

    try {
      const res = await fetch("/api/characters/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Erreur ${res.status}`);
      }

      setSavedToLibrary((prev) => new Set(prev).add(characterId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de sauvegarde"
      );
    } finally {
      setSavingToLibrary(null);
    }
  }

  async function handleUseLibraryCharacter(
    characterId: string,
    libChar: LibraryCharacter
  ) {
    setLibraryModalFor(null);

    try {
      const res = await fetch(
        `/api/characters/${characterId}/use-library`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ libraryCharacterId: libChar.id }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      const data = await res.json();
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId
            ? {
                ...c,
                referenceImagePath: data.imagePath,
                description: data.description,
                isUploaded: false,
                libraryCharacterId: data.libraryCharacterId,
              }
            : c
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur d'application du personnage"
      );
    }
  }

  async function handleValidate() {
    await fetch(`/api/stories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "characters_ready" }),
    });

    router.push(`/create/${id}/images`);
  }

  return (
    <div className="min-h-screen">
      <StarField count={30} />
      <Header />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
        <StepIndicator
          currentStep={4}
          totalSteps={5}
          labels={STEP_LABELS}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-cream font-sans">
              Personnages
            </h1>
            <p className="text-cream/60 font-sans mt-1 text-sm sm:text-base">
              Créez ou uploadez les images de référence
            </p>
          </div>
          {extracted && (
            <Button variant="secondary" onClick={handleExtract} loading={extracting}>
              Réextraire
            </Button>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-red-500/30">
            <p className="text-red-400 font-sans">{error}</p>
          </Card>
        )}

        {extracting ? (
          <Card className="text-center py-16">
            <div className="spinner h-10 w-10 border-2 border-gold/30 border-t-gold rounded-full mx-auto mb-4" />
            <p className="text-cream/60 font-sans">
              Extraction des personnages en cours...
            </p>
          </Card>
        ) : extracted ? (
          <>
            <div className="space-y-4 sm:space-y-6">
              {characters.map((char) => (
                <Card key={char.id}>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Character image */}
                    <div className="shrink-0 flex flex-row sm:flex-col items-start gap-3 sm:gap-0">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-navy/40 rounded-xl overflow-hidden border border-purple/20 flex items-center justify-center shrink-0">
                        {char.referenceImagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/images/${char.referenceImagePath.replace(/^\//, "")}`}
                            alt={char.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">👤</span>
                        )}
                      </div>
                      <div className="flex-1 sm:flex-none sm:w-full space-y-1.5 sm:mt-2">
                        <div className="flex gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleGenerateImage(char.id)}
                            loading={generatingImage === char.id}
                            className="flex-1 text-xs"
                          >
                            Générer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRefs.current[char.id]?.click()}
                            className="flex-1 text-xs"
                          >
                            Uploader
                          </Button>
                          <input
                            ref={(el) => { fileInputRefs.current[char.id] = el; }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadImage(char.id, file);
                            }}
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLibraryModalFor(char.id)}
                            className="flex-1 text-xs border border-purple/20"
                          >
                            📚 Bibliothèque
                          </Button>
                        </div>
                        {/* Save to library button — visible only when character has an image */}
                        {char.referenceImagePath && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveToLibrary(char.id)}
                            loading={savingToLibrary === char.id}
                            disabled={savedToLibrary.has(char.id)}
                            className="w-full text-xs border border-gold/20 text-gold/70 hover:text-gold"
                          >
                            {savedToLibrary.has(char.id)
                              ? "Sauvegardé ✓"
                              : "Sauvegarder en bibliothèque"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Character details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-sans font-semibold text-cream text-base sm:text-lg">
                          {char.name}
                        </h3>
                        {char.libraryCharacterId && (
                          <span className="text-xs bg-purple/30 text-purple-light px-2 py-0.5 rounded-full font-sans">
                            depuis bibliothèque
                          </span>
                        )}
                      </div>
                      <textarea
                        value={char.description}
                        onChange={(e) =>
                          handleEditDescription(char.id, e.target.value)
                        }
                        onBlur={(e) =>
                          handleSaveDescription(char.id, e.target.value)
                        }
                        rows={4}
                        className="w-full bg-navy border border-purple/20 text-cream/80 rounded-xl p-3 font-sans text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button size="lg" onClick={handleValidate}>
                Passer aux illustrations
              </Button>
            </div>
          </>
        ) : null}
      </main>

      {/* Library modal — one instance, opens for the character being edited */}
      <CharacterLibraryModal
        open={libraryModalFor !== null}
        onClose={() => setLibraryModalFor(null)}
        onSelect={(libChar) => {
          if (libraryModalFor) {
            handleUseLibraryCharacter(libraryModalFor, libChar);
          }
        }}
      />
    </div>
  );
}
