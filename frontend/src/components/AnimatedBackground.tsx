"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#fdfdfc] pointer-events-none">
      {/* Live Cinematic Noise overlay */}
      <div 
        className="absolute w-[200vw] h-[200vh] -top-[50%] -left-[50%] z-20 opacity-[0.06] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          animation: 'cinematicNoise 0.6s steps(2) infinite'
        }}
      />
      
      {/* Blob 1 - Vivid Coral/Orange */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] min-w-[500px] min-h-[500px] rounded-full filter blur-[120px] opacity-70 mix-blend-multiply"
        style={{ background: "radial-gradient(circle, hsla(15, 100%, 70%, 1) 0%, transparent 70%)" }}
        animate={{
          x: ["0%", "25%", "0%", "-15%", "0%"],
          y: ["0%", "15%", "-10%", "5%", "0%"],
          scale: [1, 1.15, 0.9, 1.05, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob 2 - Deep Violet/Purple */}
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[65vw] h-[65vw] min-w-[600px] min-h-[600px] rounded-full filter blur-[140px] opacity-60 mix-blend-multiply"
        style={{ background: "radial-gradient(circle, hsla(270, 90%, 80%, 1) 0%, transparent 70%)" }}
        animate={{
          x: ["0%", "-30%", "15%", "-10%", "0%"],
          y: ["0%", "-20%", "20%", "-5%", "0%"],
          scale: [1, 1.25, 0.85, 1.1, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Blob 3 - Electric Cyan */}
      <motion.div
        className="absolute bottom-[10%] left-[5%] w-[50vw] h-[50vw] min-w-[450px] min-h-[450px] rounded-full filter blur-[130px] opacity-60 mix-blend-multiply"
        style={{ background: "radial-gradient(circle, hsla(190, 100%, 75%, 1) 0%, transparent 70%)" }}
        animate={{
          x: ["0%", "35%", "-15%", "20%", "0%"],
          y: ["0%", "25%", "-20%", "15%", "0%"],
          scale: [1, 0.9, 1.15, 0.95, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      {/* Blob 4 - Vivid Magenta/Pink */}
      <motion.div
        className="absolute top-[20%] left-[25%] w-[60vw] h-[60vw] min-w-[500px] min-h-[500px] rounded-full filter blur-[150px] opacity-50 mix-blend-multiply"
        style={{ background: "radial-gradient(circle, hsla(320, 100%, 80%, 1) 0%, transparent 70%)" }}
        animate={{
          x: ["0%", "-25%", "25%", "-15%", "0%"],
          y: ["0%", "25%", "-15%", "20%", "0%"],
          scale: [1, 1.2, 0.8, 1.1, 1],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  );
}
