"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#f8a8b8]/20 border-t-[#f8a8b8] border-r-[#f8a8b8]/60 animate-spin-slow" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20 rounded-full blur-sm" />
        </div>
        <motion.h2 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-2xl font-serif italic font-medium tracking-tight text-[#1a1a1a]"
        >
          Mnemosyne
        </motion.h2>
      </motion.div>
    </div>
  );
}
