"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import StarField from "@/components/ui/StarField";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StepIndicator from "@/components/story/StepIndicator";
import { wordCount, estimateReadingTime } from "@/lib/utils";
import type { StoryPage } from "@/types";

const STEP_LABELS = [
  "Thème",
  "Plan",
  "Texte",
  "Personnages",
  "Illustrations",
];

export default function TextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/stories/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.pages && data.pages.length > 0) {
          setPages(data.pages);
          setGenerated(true);
        } else {
          handleGenerate();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch(`/api/stories/${id}/generate-text`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la génération");
      }

      const data = await res.json();
      setPages(data.pages);
      setGenerated(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la génération"
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleEditPage(pageId: string, text: string) {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, text } : p))
    );
  }

  async function handleSavePage(pageId: string, text: string) {
    await fetch(`/api/stories/${id}/pages/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }

  async function handleValidate() {
    setSaving(true);

    // Save all pages
    for (const page of pages) {
      await handleSavePage(page.id, page.text);
    }

    await fetch(`/api/stories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "text_ready" }),
    });

    router.push(`/create/${id}/characters`);
  }

  const totalText = pages.map((p) => p.text).join(" ");
  const totalWords = wordCount(totalText);
  const readingTime = estimateReadingTime(totalText);

  return (
    <div className="min-h-screen">
      <StarField count={30} />
      <Header />

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <StepIndicator
          currentStep={3}
          totalSteps={5}
          labels={STEP_LABELS}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cream font-sans">
              Texte de l&apos;histoire
            </h1>
            <p className="text-cream/60 font-sans mt-1">
              Relisez et modifiez le texte de chaque page
            </p>
          </div>
          {generated && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-cream/60 font-sans">
                  {totalWords} mots
                </p>
                <p className="text-sm text-gold font-sans">
                  ~{readingTime} min de lecture
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleGenerate}
                loading={generating}
              >
                Régénérer
              </Button>
            </div>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-red-500/30">
            <p className="text-red-400 font-sans">{error}</p>
          </Card>
        )}

        {generating ? (
          <Card className="text-center py-16">
            <div className="spinner h-10 w-10 border-2 border-gold/30 border-t-gold rounded-full mx-auto mb-4" />
            <p className="text-cream/60 font-sans">
              Génération du texte en cours...
            </p>
          </Card>
        ) : generated ? (
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
                    <span className="ml-auto text-xs text-cream/40 font-sans">
                      {wordCount(page.text)} mots
                    </span>
                  </div>

                  {/* Image placeholder */}
                  <div className="aspect-[4/3] bg-navy/40 rounded-xl mb-4 flex items-center justify-center border border-dashed border-purple/20">
                    <span className="text-cream/30 font-sans text-sm">
                      Illustration (étape 5)
                    </span>
                  </div>

                  <textarea
                    value={page.text}
                    onChange={(e) => handleEditPage(page.id, e.target.value)}
                    onBlur={() => handleSavePage(page.id, page.text)}
                    rows={6}
                    className="w-full bg-navy border border-purple/20 text-cream rounded-xl p-4 font-serif text-base leading-relaxed focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
                  />
                </Card>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button size="lg" onClick={handleValidate} loading={saving}>
                Valider le texte
              </Button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
