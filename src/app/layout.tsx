import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storypillow — Histoires illustrées pour enfants",
  description:
    "Générez des histoires illustrées personnalisées pour vos enfants, propulsées par l'IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
