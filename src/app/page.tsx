"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import StarField from "@/components/ui/StarField";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { Story } from "@/types";

interface StoryWithMeta extends Story {
  creatorName: string | null;
  coverImage: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  plan_ready: "Plan prêt",
  text_ready: "Texte prêt",
  characters_ready: "Personnages prêts",
  images_ready: "Images prêtes",
  complete: "Terminée",
};

export default function DashboardPage() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => {
        setStories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleCreateNew() {
    router.push("/create/new");
  }

  function handleOpenStory(story: StoryWithMeta) {
    if (story.status === "complete") {
      router.push(`/read/${story.id}`);
    } else {
      const stepMap: Record<string, string> = {
        draft: `/create/${story.id}`,
        plan_ready: `/create/${story.id}/plan`,
        text_ready: `/create/${story.id}/text`,
        characters_ready: `/create/${story.id}/characters`,
        images_ready: `/create/${story.id}/images`,
      };
      router.push(stepMap[story.status] || `/create/${story.id}`);
    }
  }

  async function handleDelete(e: React.MouseEvent, storyId: string) {
    e.stopPropagation();
    if (!confirm("Supprimer cette histoire ?")) return;
    await fetch(`/api/stories/${storyId}`, { method: "DELETE" });
    setStories((prev) => prev.filter((s) => s.id !== storyId));
  }

  return (
    <div className="min-h-screen">
      <StarField />
      <Header />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cream font-sans">
              Bibliothèque
            </h1>
            <p className="text-cream/60 mt-1 font-sans">
              Toutes les histoires illustrées
            </p>
          </div>
          <Button onClick={handleCreateNew} size="lg">
            + Nouvelle histoire
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full" />
          </div>
        ) : stories.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-xl font-sans font-semibold text-cream mb-2">
              Aucune histoire pour l&apos;instant
            </h2>
            <p className="text-cream/60 font-sans mb-6">
              Créez votre première histoire illustrée pour votre enfant
            </p>
            <Button onClick={handleCreateNew}>
              Créer ma première histoire
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card
                key={story.id}
                onClick={() => handleOpenStory(story)}
                className="group"
              >
                <div className="aspect-[4/3] bg-navy/60 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  {story.coverImage ? (
                    <img
                      src={`/api/images/${story.coverImage}`}
                      alt={story.title || "Couverture"}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : story.status === "complete" ? (
                    <div className="text-6xl">📖</div>
                  ) : (
                    <div className="text-4xl opacity-40">✏️</div>
                  )}
                </div>
                <h3 className="font-sans font-semibold text-cream text-lg truncate">
                  {story.title || "Histoire sans titre"}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-sans px-2 py-1 rounded-full bg-purple/30 text-purple-light">
                    {STATUS_LABELS[story.status] || story.status}
                  </span>
                  <span className="text-xs text-cream/40 font-sans">
                    {formatDate(story.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-cream/50 font-sans truncate">
                    {story.childName}
                    {story.creatorName && (
                      <> &middot; par {story.creatorName}</>
                    )}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, story.id)}
                    className="text-red-400/50 hover:text-red-400 text-sm font-sans transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    Supprimer
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
