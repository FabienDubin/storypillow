"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import StarField from "@/components/ui/StarField";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StepIndicator from "@/components/story/StepIndicator";
import type { Character } from "@/types";

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
            ? { ...c, referenceImagePath: data.imagePath, isUploaded: false }
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
            ? { ...c, referenceImagePath: data.imagePath, isUploaded: true }
            : c
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur d'upload"
      );
    }
  }

  async function handleEditDescription(characterId: string, description: string) {
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId ? { ...c, description } : c
      )
    );

    await fetch(`/api/characters/${characterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
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

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <StepIndicator
          currentStep={4}
          totalSteps={5}
          labels={STEP_LABELS}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cream font-sans">
              Personnages
            </h1>
            <p className="text-cream/60 font-sans mt-1">
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
            <div className="space-y-6">
              {characters.map((char) => (
                <Card key={char.id}>
                  <div className="flex gap-6">
                    {/* Character image */}
                    <div className="shrink-0">
                      <div className="w-32 h-32 bg-navy/40 rounded-xl overflow-hidden border border-purple/20 flex items-center justify-center">
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
                      <div className="flex gap-2 mt-2">
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
                    </div>

                    {/* Character details */}
                    <div className="flex-1">
                      <h3 className="font-sans font-semibold text-cream text-lg mb-2">
                        {char.name}
                      </h3>
                      <textarea
                        value={char.description}
                        onChange={(e) =>
                          handleEditDescription(char.id, e.target.value)
                        }
                        rows={4}
                        className="w-full bg-navy border border-purple/20 text-cream/80 rounded-xl p-3 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
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
    </div>
  );
}
