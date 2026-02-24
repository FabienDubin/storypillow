"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import StarField from "@/components/ui/StarField";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import DurationSlider from "@/components/ui/DurationSlider";
import StepIndicator from "@/components/story/StepIndicator";
import {
  THEME_OPTIONS,
  SETTING_OPTIONS,
  TONE_OPTIONS,
  MORAL_OPTIONS,
} from "@/types";

const STEP_LABELS = [
  "Thème",
  "Plan",
  "Texte",
  "Personnages",
  "Illustrations",
];

export default function CreateNewStoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState("");
  const [setting, setSetting] = useState("");
  const [tone, setTone] = useState("");
  const [moral, setMoral] = useState("");
  const [duration, setDuration] = useState(10);
  const [childName, setChildName] = useState("");
  const [context, setContext] = useState("");

  const isValid = theme && setting && tone && moral && childName;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          setting,
          tone,
          moral,
          duration,
          childName,
          context,
        }),
      });

      const { id } = await res.json();
      router.push(`/create/${id}/plan`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <StarField count={30} />
      <Header />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
        <StepIndicator
          currentStep={1}
          totalSteps={5}
          labels={STEP_LABELS}
        />

        <h1 className="text-xl sm:text-2xl font-bold text-cream font-sans mb-2">
          Nouvelle histoire
        </h1>
        <p className="text-cream/60 font-sans mb-6 sm:mb-8 text-sm sm:text-base">
          Configurez le thème et les paramètres de l&apos;histoire
        </p>

        <form onSubmit={handleSubmit}>
          <Card className="space-y-4 sm:space-y-6">
            <Input
              label="Prénom de l'enfant"
              value={childName}
              onChange={setChildName}
              placeholder="ex: Léa, Hugo..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Select
                label="Thématique"
                value={theme}
                onChange={setTheme}
                options={THEME_OPTIONS}
              />
              <Select
                label="Lieu"
                value={setting}
                onChange={setSetting}
                options={SETTING_OPTIONS}
              />
              <Select
                label="Ton"
                value={tone}
                onChange={setTone}
                options={TONE_OPTIONS}
              />
              <Select
                label="Valeur / Morale"
                value={moral}
                onChange={setMoral}
                options={MORAL_OPTIONS}
              />
            </div>

            <DurationSlider value={duration} onChange={setDuration} />

            <Input
              label="Contexte additionnel (optionnel)"
              value={context}
              onChange={setContext}
              multiline
              placeholder="ex: on est en vacances au bord de la mer, ma fille adore les chats..."
            />
          </Card>

          <div className="flex justify-end mt-6">
            <Button type="submit" size="lg" loading={loading} disabled={!isValid}>
              Générer le plan narratif
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
