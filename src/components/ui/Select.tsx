"use client";

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Choisir...",
}: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-sans font-medium text-cream/80 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-navy-light border border-purple/30 text-cream rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
