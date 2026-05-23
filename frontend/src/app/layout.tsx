import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Mnemosyne — Cognitive Learning OS",
  description: "AI-powered memory and learning system",
};

import { Heart } from "lucide-react";
import Preloader from "@/components/Preloader";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans text-slate-800 bg-mesh-editorial flex flex-col min-h-screen`}>
        <Preloader />
        <Nav />
        <main className="flex-grow pt-24 sm:pt-28 md:pt-40 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
        
        <footer className="w-full py-8 mt-12 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 flex flex-col items-center justify-center text-center">
            <p className="flex items-center justify-center gap-1.5 text-sm sm:text-base font-medium text-slate-600 mb-2">
              Made with <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[#f8a8b8] fill-[#f8a8b8]" /> for <span className="font-serif italic font-semibold text-[#1a1a1a]">Mnemosyne</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} Mnemosyne. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
