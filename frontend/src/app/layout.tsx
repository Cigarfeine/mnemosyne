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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans text-slate-800 bg-mesh-editorial`}>
        <Nav />
        <div className="min-h-screen pt-40 pb-12 px-6 max-w-6xl mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
