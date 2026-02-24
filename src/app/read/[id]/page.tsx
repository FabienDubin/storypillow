"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import type { Story, StoryPage } from "@/types";

export default function ReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stories/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setStory(data);
        setPages(data.pages || []);
        setLoading(false);
      })
      .catch(() => {
        router.replace("/");
      });
  }, [id, router]);

  const goNext = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage, pages.length]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  // Keyboard navigation (arrow keys only — space must scroll)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        router.push("/");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, router]);

  // Touch/swipe navigation — only trigger on deliberate horizontal swipes
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    function handleTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function handleTouchEnd(e: TouchEvent) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Only navigate if horizontal movement is dominant (>2x vertical)
      // and exceeds the minimum threshold
      if (Math.abs(diffX) > 80 && Math.abs(diffX) > Math.abs(diffY) * 2) {
        if (diffX > 0) goNext();
        else goPrev();
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goNext, goPrev]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="spinner h-10 w-10 border-2 border-gold/30 border-t-gold rounded-full" />
      </div>
    );
  }

  if (!story || pages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <p className="text-cream/60 font-sans">
          Cette histoire n&apos;est pas encore prête.
        </p>
      </div>
    );
  }

  const page = pages[currentPage];
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === pages.length - 1;

  const bgColor = darkMode ? "bg-[#1a1a2e]" : "bg-cream";
  const textColor = darkMode ? "text-cream" : "text-[#1a1a2e]";
  const subtitleColor = darkMode ? "text-cream/60" : "text-[#1a1a2e]/60";

  return (
    <div
      className={`min-h-screen landscape:min-h-0 landscape:h-dvh ${bgColor} ${textColor} flex flex-col select-none landscape:overflow-hidden`}
    >
      {/* Top bar — always visible, subtle */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 z-20">
        <button
          onClick={() => router.push("/")}
          className={`font-sans text-sm transition-colors cursor-pointer ${
            darkMode
              ? "text-cream/60 hover:text-cream"
              : "text-[#1a1a2e]/60 hover:text-[#1a1a2e]"
          }`}
        >
          ← Retour
        </button>
        <span className={`${subtitleColor} font-sans text-sm`}>
          {currentPage + 1} / {pages.length}
        </span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`font-sans text-sm transition-colors cursor-pointer ${
            darkMode
              ? "text-cream/60 hover:text-cream"
              : "text-[#1a1a2e]/60 hover:text-[#1a1a2e]"
          }`}
        >
          {darkMode ? "☀️ Clair" : "🌙 Sombre"}
        </button>
      </div>

      {/* Main content — portrait: scrollable stacked, landscape: side by side locked */}
      <div
        className="flex-1 landscape:min-h-0 flex flex-col landscape:flex-row transition-opacity duration-300"
        key={currentPage}
      >
        {/* Illustration — portrait: full height with side margins, landscape: half-width */}
        <div className="flex-1 landscape:flex-none relative overflow-hidden min-h-[40vh] px-12 landscape:px-0 landscape:w-1/2">
          {page.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/images/${page.imagePath.replace(/^\//, "")}`}
              alt={page.title}
              className="w-full h-full object-cover rounded-2xl landscape:rounded-none"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                darkMode ? "bg-navy-light/30" : "bg-cream-dark"
              }`}
            >
              <span className="text-6xl opacity-20">🎨</span>
            </div>
          )}

          {/* Gradient overlay — portrait only */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-32 landscape:hidden bg-gradient-to-t ${
              darkMode ? "from-[#1a1a2e]" : "from-cream"
            } to-transparent`}
          />
        </div>

        {/* Text section — portrait: normal flow, landscape: scrollable within bounds */}
        <div className="landscape:flex-1 landscape:min-h-0 landscape:overflow-y-auto landscape:w-1/2">
          <div className="px-8 py-8 md:px-16 lg:px-24 landscape:px-8 landscape:md:px-12 landscape:min-h-full landscape:flex landscape:flex-col landscape:justify-center">
            <h2
              className={`font-sans font-bold text-lg mb-4 ${
                darkMode ? "text-gold" : "text-purple"
              }`}
            >
              {page.title}
            </h2>
            <div
              className={`font-serif text-xl md:text-2xl leading-relaxed ${textColor} whitespace-pre-line`}
            >
              {page.text}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="shrink-0 flex items-center justify-between px-8 py-4">
        <button
          onClick={goPrev}
          disabled={isFirstPage}
          className={`px-6 py-3 rounded-xl font-sans font-semibold transition-all cursor-pointer ${
            isFirstPage
              ? "opacity-20 cursor-not-allowed"
              : darkMode
                ? "text-cream/70 hover:text-cream hover:bg-white/5"
                : "text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-black/5"
          }`}
        >
          ← Précédent
        </button>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                i === currentPage
                  ? "bg-gold w-6"
                  : darkMode
                    ? "bg-cream/20 hover:bg-cream/40"
                    : "bg-[#1a1a2e]/20 hover:bg-[#1a1a2e]/40"
              }`}
            />
          ))}
        </div>

        <button
          onClick={isLastPage ? () => router.push("/") : goNext}
          className={`px-6 py-3 rounded-xl font-sans font-semibold transition-all cursor-pointer ${
            darkMode
              ? "text-cream/70 hover:text-cream hover:bg-white/5"
              : "text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-black/5"
          }`}
        >
          {isLastPage ? "Fin ✨" : "Suivant →"}
        </button>
      </div>
    </div>
  );
}
