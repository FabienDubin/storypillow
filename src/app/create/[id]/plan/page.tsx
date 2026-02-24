"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import StarField from "@/components/ui/StarField";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StepIndicator from "@/components/story/StepIndicator";
import type { PlanItem } from "@/types";

const STEP_LABELS = [
  "Thème",
  "Plan",
  "Texte",
  "Personnages",
  "Illustrations",
];

export default function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState("");

  // Load story data
  useEffect(() => {
    fetch(`/api/stories/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.plan && data.plan.length > 0) {
          setTitle(data.title);
          setPlan(data.plan);
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
      const res = await fetch(`/api/stories/${id}/generate-plan`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la génération");
      }

      const data = await res.json();
      setTitle(data.title);
      setPlan(data.plan);
      setGenerated(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la génération"
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleEditItem(index: number, field: keyof PlanItem, value: string) {
    setPlan((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function handleRemoveItem(index: number) {
    setPlan((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddItem() {
    setPlan((prev) => [
      ...prev,
      { title: "Nouvelle scène", description: "Description de la scène..." },
    ]);
  }

  function handleMoveItem(index: number, direction: "up" | "down") {
    const newPlan = [...plan];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPlan.length) return;
    [newPlan[index], newPlan[targetIndex]] = [
      newPlan[targetIndex],
      newPlan[index],
    ];
    setPlan(newPlan);
  }

  async function handleValidate() {
    setSaving(true);

    await fetch(`/api/stories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, plan, status: "plan_ready" }),
    });

    router.push(`/create/${id}/text`);
  }

  return (
    <div className="min-h-screen">
      <StarField count={30} />
      <Header />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
        <StepIndicator
          currentStep={2}
          totalSteps={5}
          labels={STEP_LABELS}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-cream font-sans">
              Plan narratif
            </h1>
            <p className="text-cream/60 font-sans mt-1 text-sm sm:text-base">
              Revoyez et modifiez le plan de l&apos;histoire
            </p>
          </div>
          {generated && (
            <Button
              variant="secondary"
              onClick={handleGenerate}
              loading={generating}
            >
              Régénérer
            </Button>
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
              Génération du plan en cours...
            </p>
          </Card>
        ) : generated ? (
          <>
            <Card className="mb-6">
              <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
                Titre de l&apos;histoire
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-navy border border-purple/30 text-cream text-lg sm:text-xl font-bold rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </Card>

            <div className="space-y-4">
              {plan.map((item, index) => (
                <Card key={index} className="relative">
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveItem(index, "up")}
                        disabled={index === 0}
                        className="text-cream/40 hover:text-cream disabled:opacity-20 text-sm cursor-pointer p-1"
                      >
                        ▲
                      </button>
                      <span className="text-gold font-sans font-bold text-center">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => handleMoveItem(index, "down")}
                        disabled={index === plan.length - 1}
                        className="text-cream/40 hover:text-cream disabled:opacity-20 text-sm cursor-pointer p-1"
                      >
                        ▼
                      </button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          handleEditItem(index, "title", e.target.value)
                        }
                        className="w-full bg-transparent border-b border-purple/20 text-cream font-sans font-semibold py-1 focus:outline-none focus:border-gold/50"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) =>
                          handleEditItem(index, "description", e.target.value)
                        }
                        rows={2}
                        className="w-full bg-transparent border border-purple/20 text-cream/80 rounded-lg p-2 font-sans text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-400/50 hover:text-red-400 text-sm shrink-0 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={handleAddItem}>
                + Ajouter une scène
              </Button>
              <Button size="lg" onClick={handleValidate} loading={saving}>
                Valider le plan
              </Button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
