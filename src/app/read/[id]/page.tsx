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
    }
  }, [currentPage, pages.length]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
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

  // Touch/swipe navigation
  useEffect(() => {
    let startX = 0;

    function handleTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
    }

    function handleTouchEnd(e: TouchEvent) {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) goNext();
        else goPrev();
      }
    }

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
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
      className={`min-h-screen ${bgColor} ${textColor} flex flex-col select-none`}
    >
      {/* Top bar — minimal */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => router.push("/")}
          className={`${subtitleColor} hover:${textColor} font-sans text-sm transition-colors cursor-pointer`}
        >
          ← Retour
        </button>
        <span className={`${subtitleColor} font-sans text-sm`}>
          {currentPage + 1} / {pages.length}
        </span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`${subtitleColor} hover:${textColor} font-sans text-sm transition-colors cursor-pointer`}
        >
          {darkMode ? "☀️ Clair" : "🌙 Sombre"}
        </button>
      </div>

      {/* Cover page */}
      {isFirstPage && currentPage === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-8">
          {/* Show cover only if we're on "page 0" conceptually — we use the first page */}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Illustration */}
        <div className="flex-1 relative overflow-hidden">
          {page.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/images/${page.imagePath.replace(/^\//, "")}`}
              alt={page.title}
              className="w-full h-full object-cover"
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

          {/* Gradient overlay for text readability */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t ${
              darkMode ? "from-[#1a1a2e]" : "from-cream"
            } to-transparent`}
          />
        </div>

        {/* Text section */}
        <div className="px-8 py-8 md:px-16 lg:px-24 max-w-4xl mx-auto w-full">
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

      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-8 py-6">
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
