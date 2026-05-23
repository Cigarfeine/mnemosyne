"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run the preloader once per session to avoid annoying the user on every reload
    const hasLoaded = sessionStorage.getItem("mnemosyne-preloaded");
    if (hasLoaded) {
      setTimeout(() => setIsLoading(false), 0);
      return;
    }

    // Prevent scrolling while preloader is active
    document.body.style.overflow = "hidden";
    
    // Simulate loading progress
    let currentProgress = 0;
    const duration = 2000; // 2 seconds
    const interval = 20; // Update every 20ms
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      currentProgress += step;
      // Add some random stutter to make it feel "real"
      if (Math.random() > 0.8) {
        currentProgress += step * 2;
      }
      
      if (currentProgress >= 100) {
        clearInterval(timer);
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          sessionStorage.setItem("mnemosyne-preloaded", "true");
          document.body.style.overflow = "auto";
        }, 500); // Pause at 100% for half a second before sliding up
      } else {
        setProgress(currentProgress);
      }
    }, interval);

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[100] bg-[#fcfaf7] flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm px-6">
            <motion.h1 
              initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="font-serif italic font-medium tracking-tight text-5xl sm:text-7xl text-[#1a1a1a] mb-12"
            >
              Mnemosyne
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full flex items-center gap-4"
            >
              <div className="h-[3px] flex-1 bg-slate-200/60 rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute top-0 left-0 bottom-0 bg-[#f8a8b8]"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
              <div className="text-sm font-mono text-slate-400 font-medium min-w-[3ch] text-right">
                {Math.round(Math.min(progress, 100))}%
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
