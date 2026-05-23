"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <>
      <motion.div
        key={`sweep-${path}`}
        className="fixed inset-0 z-[60] bg-[#f8a8b8] pointer-events-none flex items-center justify-center overflow-hidden"
        initial={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
        animate={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" }}
        transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
      >
        <motion.div 
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="font-serif italic font-medium tracking-tight text-4xl text-white/90"
        >
          Mnemosyne
        </motion.div>
      </motion.div>

      <motion.div
        key={`content-${path}`}
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </>
  );
}
