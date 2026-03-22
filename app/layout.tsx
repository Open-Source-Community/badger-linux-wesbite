import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Club Badge System",
  description: "Earn badges, prove your skills, climb the leaderboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-text-base min-h-screen antialiased">
        <Providers>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
