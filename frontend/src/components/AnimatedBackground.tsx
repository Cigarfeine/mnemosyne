"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#f7f5f2] pointer-events-none">
      {/* Noise overlay */}
      <div 
        className="absolute inset-0 z-10 opacity-[0.06] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Blob 1 - Pinkish */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] rounded-full mix-blend-multiply filter blur-[80px] opacity-80"
        style={{ background: "radial-gradient(circle, hsla(339, 49%, 85%, 1) 0%, transparent 70%)" }}
        animate={{
          x: ["0%", "20%", "0%", "-15%", "0%"],
          y: ["0%", "15%", "-10%", "5%", "0%"],
          scale: [1, 1.1, 0.9, 1.05, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob 2 - Mint Green */}
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] min-w-[600px] min-h-[600px] rounded-full mix-blend-multiply filter blur-[100px] opacity-70"
        style={{ background: "radial-gradient(circle, hsla(168, 48%, 82%, 1) 0%, transparent 70%)" }}
        animate={{
          x: ["0%", "-30%", "10%", "-10%", "0%"],
          y: ["0%", "-20%", "15%", "-5%", "0%"],
          scale: [1, 1.2, 0.8, 1.1, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Blob 3 - Orange/Peach */}
      <motion.div
        className="absolute bottom-[20%] left-[10%] w-[45vw] h-[45vw] min-w-[450px] min-h-[450px] rounded-full mix-blend-multiply filter blur-[90px] opacity-60"
        style={{ background: "radial-gradient(circle, hsla(25, 96%, 74%, 1) 0%, transparent 70%)" }}
        animate={{
          x: ["0%", "30%", "-10%", "20%", "0%"],
          y: ["0%", "20%", "-20%", "10%", "0%"],
          scale: [1, 0.9, 1.1, 0.95, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      {/* Blob 4 - Soft White Center */}
      <motion.div
        className="absolute top-[30%] left-[30%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] rounded-full mix-blend-screen filter blur-[100px] opacity-90"
        style={{ background: "radial-gradient(circle, hsla(355, 0%, 97%, 1) 0%, transparent 70%)" }}
        animate={{
          x: ["0%", "-20%", "20%", "-10%", "0%"],
          y: ["0%", "20%", "-10%", "15%", "0%"],
          scale: [1, 1.15, 0.85, 1.05, 1],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  );
}
