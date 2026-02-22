"use client";

import { DURATION_OPTIONS } from "@/types";

interface DurationSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function DurationSlider({
  value,
  onChange,
}: DurationSliderProps) {
  return (
    <div>
      <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
        Durée de lecture
      </label>
      <div className="flex items-center gap-4">
        {DURATION_OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`flex-1 py-3 rounded-xl font-sans font-semibold text-sm transition-all duration-200 cursor-pointer ${
              value === d
                ? "bg-gold text-navy shadow-lg shadow-gold/20"
                : "bg-navy-light border border-purple/30 text-cream/60 hover:border-purple-light/50"
            }`}
          >
            {d} min
          </button>
        ))}
      </div>
    </div>
  );
}
