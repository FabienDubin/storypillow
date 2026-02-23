"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import StarField from "@/components/ui/StarField";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StepIndicator from "@/components/story/StepIndicator";
import type { StoryPage } from "@/types";

const STEP_LABELS = [
  "Thème",
  "Plan",
  "Texte",
  "Personnages",
  "Illustrations",
];

export default function ImagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingSingle, setGeneratingSingle] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/stories/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.pages) {
          setPages(data.pages);

          // If pages don't have prompts yet, generate them
          const needsPrompts = data.pages.some(
            (p: StoryPage) => !p.imagePrompt
          );
          if (needsPrompts) {
            generatePrompts();
          }
        }
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function generatePrompts() {
    try {
      const res = await fetch(`/api/stories/${id}/generate-prompts`, {
        method: "POST",
      });

      if (!res.ok) {
        // Fallback: use simple client-side prompts
        console.error("AI prompt generation failed, using fallback");
        return;
      }

      const data = await res.json();
      if (data.pages) {
        setPages(data.pages);
      }
    } catch (err) {
      console.error("Error generating prompts:", err);
    }
  }

  function handleEditPrompt(pageId: string, imagePrompt: string) {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, imagePrompt } : p))
    );
  }

  async function handleSavePrompt(pageId: string, imagePrompt: string) {
    await fetch(`/api/stories/${id}/pages/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagePrompt }),
    });
  }

  async function handleGenerateSingle(pageId: string) {
    setGeneratingSingle(pageId);
    setError("");

    try {
      const res = await fetch(
        `/api/stories/${id}/pages/${pageId}/generate-image`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de génération");
      }

      const data = await res.json();
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, imagePath: data.imagePath } : p
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de génération"
      );
    } finally {
      setGeneratingSingle(null);
    }
  }

  async function handleGenerateAll() {
    setGeneratingAll(true);
    setError("");

    try {
      // Save all prompts first
      for (const page of pages) {
        if (page.imagePrompt) {
          await handleSavePrompt(page.id, page.imagePrompt);
        }
      }

      const res = await fetch(`/api/stories/${id}/generate-images`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de génération");
      }

      const data = await res.json();

      // Update pages with generated images
      setPages((prev) =>
        prev.map((p) => {
          const result = data.results.find(
            (r: { pageId: string; imagePath: string | null }) => r.pageId === p.id
          );
          if (result?.imagePath) {
            return { ...p, imagePath: result.imagePath };
          }
          return p;
        })
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de génération"
      );
    } finally {
      setGeneratingAll(false);
    }
  }

  async function handleFinish() {
    await fetch(`/api/stories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "complete" }),
    });
    router.push(`/read/${id}`);
  }

  const allImagesGenerated = pages.length > 0 && pages.every((p) => p.imagePath);

  return (
    <div className="min-h-screen">
      <StarField count={30} />
      <Header />

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <StepIndicator
          currentStep={5}
          totalSteps={5}
          labels={STEP_LABELS}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cream font-sans">
              Illustrations
            </h1>
            <p className="text-cream/60 font-sans mt-1">
              Modifiez les prompts et générez les images
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateAll}
              loading={generatingAll}
              disabled={generatingAll}
            >
              Générer toutes les images
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-500/30">
            <p className="text-red-400 font-sans">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card className="text-center py-16">
            <div className="spinner h-10 w-10 border-2 border-gold/30 border-t-gold rounded-full mx-auto mb-4" />
          </Card>
        ) : (
          <>
            <div className="space-y-6">
              {pages.map((page, index) => (
                <Card key={page.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-gold/20 text-gold px-2.5 py-1 rounded-lg text-sm font-sans font-bold">
                      Page {index + 1}
                    </span>
                    <h3 className="font-sans font-semibold text-cream">
                      {page.title}
                    </h3>
                  </div>

                  <p className="text-cream/60 text-sm font-serif mb-4 line-clamp-3">
                    {page.text}
                  </p>

                  {/* Image preview */}
                  <div className="aspect-[4/3] bg-navy/40 rounded-xl mb-4 overflow-hidden border border-purple/20 flex items-center justify-center">
                    {page.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/images/${page.imagePath.replace(/^\//, "")}`}
                        alt={page.title}
                        className="w-full h-full object-cover"
                      />
                    ) : generatingSingle === page.id || generatingAll ? (
                      <div className="text-center">
                        <div className="spinner h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full mx-auto mb-2" />
                        <span className="text-cream/40 font-sans text-sm">
                          Génération en cours...
                        </span>
                      </div>
                    ) : (
                      <span className="text-cream/30 font-sans text-sm">
                        Pas encore d&apos;image
                      </span>
                    )}
                  </div>

                  {/* Prompt editor */}
                  <label className="block text-xs font-sans text-cream/50 mb-1">
                    Prompt de génération
                  </label>
                  <textarea
                    value={page.imagePrompt || ""}
                    onChange={(e) => handleEditPrompt(page.id, e.target.value)}
                    onBlur={() => {
                      if (page.imagePrompt)
                        handleSavePrompt(page.id, page.imagePrompt);
                    }}
                    rows={3}
                    className="w-full bg-navy border border-purple/20 text-cream/70 rounded-xl p-3 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none mb-3"
                  />

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerateSingle(page.id)}
                      loading={generatingSingle === page.id}
                      disabled={generatingAll}
                    >
                      {page.imagePath ? "Régénérer" : "Générer"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                size="lg"
                onClick={handleFinish}
                disabled={!allImagesGenerated}
              >
                Terminer et lire l&apos;histoire
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
