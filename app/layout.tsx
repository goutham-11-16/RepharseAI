import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RephrazeAI — Local AI Rewriting Laboratory",
  description:
    "Compare and test local AI rewriting quality with multiple modes using Ollama.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
