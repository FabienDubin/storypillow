"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-sans font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary: "bg-gold text-navy hover:bg-gold-light shadow-lg shadow-gold/20",
    secondary:
      "bg-purple/30 text-cream border border-purple-light/30 hover:bg-purple/50",
    danger: "bg-red-600/80 text-white hover:bg-red-600",
    ghost: "text-cream/70 hover:text-cream hover:bg-white/10",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[36px] sm:min-h-[40px]",
    md: "px-4 py-2.5 text-sm sm:text-base sm:px-5 min-h-[44px]",
    lg: "px-6 py-3 text-base sm:text-lg sm:px-8 sm:py-3.5 min-h-[44px]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="spinner -ml-1 mr-2 h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
