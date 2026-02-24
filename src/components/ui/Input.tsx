"use client";

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

export default function Input({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
}: InputProps) {
  const baseClass =
    "w-full bg-navy-light border border-purple/30 text-cream rounded-xl px-4 py-3 font-sans text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 placeholder-cream/30";

  return (
    <div>
      <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}
