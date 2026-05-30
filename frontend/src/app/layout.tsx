import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: "italic"
});

export const metadata: Metadata = {
  title: "Mnemosyne - Precision PYQ Study Guides",
  description: "AI-generated exam guides based exactly on what appears in Previous Year Questions.",
};

import LenisProvider from "@/components/ui/LenisProvider";
import Noise from "@/components/ui/Noise";
import Navbar from "@/components/ui/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased">
        <Noise
          patternSize={180}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={10}
        />
        <LenisProvider>
          <Navbar />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
