import Link from "next/link";

export default function Header() {
  return (
    <header className="relative z-10 border-b border-purple/20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-3xl" role="img" aria-label="moon">
            🌙
          </span>
          <span className="text-xl font-bold text-cream group-hover:text-gold transition-colors font-sans">
            Storypillow
          </span>
        </Link>
      </div>
    </header>
  );
}
