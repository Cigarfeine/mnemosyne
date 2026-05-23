"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, ExternalLink, Check, AlertCircle } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("mnemosyne_groq_key");
      if (stored) setApiKey(stored);
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem("mnemosyne_groq_key", apiKey.trim());
    setIsSaved(true);
    onSave(apiKey.trim());
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{ willChange: "opacity" }}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ willChange: "transform, opacity" }}
            className="relative w-full max-w-lg bg-white/70 backdrop-blur-xl backdrop-saturate-150 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25),_0_0_40px_rgba(0,0,0,0.05),_0_1px_3px_rgba(255,255,255,0.8)_inset,_0_0_0_1px_rgba(255,255,255,0.5)_inset] border border-white/60 overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#DF5830]/10 rounded-full blur-3xl pointer-events-none hidden sm:block" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#1a1a1a]/5 rounded-full blur-3xl pointer-events-none hidden sm:block" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-white to-slate-50 flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1),_0_1px_2px_rgba(255,255,255,1)_inset] border border-white shrink-0">
                  <div className="absolute inset-0 rounded-2xl bg-[#DF5830]/5" />
                  <Key className="w-5 h-5 sm:w-6 sm:h-6 text-[#DF5830] relative z-10" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-[#1a1a1a] tracking-tight mb-1">Setup AI</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium tracking-wide">Bring your own Groq API Key</p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5 mb-8 sm:mb-10">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-b from-white to-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.05),_0_1px_0_rgba(255,255,255,1)_inset] border border-slate-200/60 text-slate-600 flex items-center justify-center text-[10px] sm:text-xs font-bold font-sans">1</div>
                  <div className="pt-0.5">
                    <p className="text-sm text-slate-700 font-bold mb-1">Go to the Groq Console</p>
                    <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#DF5830] bg-[#DF5830]/5 hover:bg-[#DF5830]/10 px-3 py-1.5 rounded-lg transition-colors font-medium border border-[#DF5830]/10">
                      console.groq.com/keys <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-b from-white to-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.05),_0_1px_0_rgba(255,255,255,1)_inset] border border-slate-200/60 text-slate-600 flex items-center justify-center text-[10px] sm:text-xs font-bold font-sans">2</div>
                  <p className="text-sm text-slate-700 font-bold mt-1">Click "Create API Key"</p>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-b from-white to-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.05),_0_1px_0_rgba(255,255,255,1)_inset] border border-slate-200/60 text-slate-600 flex items-center justify-center text-[10px] sm:text-xs font-bold font-sans">3</div>
                  <div className="w-full pt-0.5 sm:pt-1">
                    <p className="text-sm text-slate-700 font-bold mb-3">Paste it here securely</p>
                    <div className="relative">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="gsk_..."
                        className="w-full pl-4 pr-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),_0_1px_2px_rgba(0,0,0,0.02)_inset] focus:outline-none focus:border-[#DF5830]/50 focus:ring-4 focus:ring-[#DF5830]/10 focus:bg-white/90 transition-all text-slate-700 font-mono tracking-widest text-sm sm:text-base placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400"
                      />
                      {apiKey && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                      )}
                    </div>
                    <div className="mt-3 sm:mt-4 flex items-start gap-2 bg-slate-50/50 rounded-xl p-2.5 sm:p-3 border border-slate-100">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-medium">
                        Your key is stored locally in your browser and is never saved to our database.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 sm:pt-2 border-t border-slate-100/50">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 sm:py-3 rounded-full text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors w-full sm:w-auto text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!apiKey.trim()}
                  className={`flex items-center justify-center gap-2 px-8 py-2.5 sm:py-3 rounded-full text-sm font-bold transition-all shadow-sm w-full sm:w-auto ${
                    isSaved 
                      ? "bg-emerald-500 text-white shadow-emerald-500/30" 
                      : apiKey.trim() 
                        ? "bg-[#1a1a1a] text-white hover:bg-black shadow-[0_8px_16px_-4px_rgba(0,0,0,0.2),_0_1px_1px_rgba(255,255,255,0.2)_inset] hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-4px_rgba(0,0,0,0.3),_0_1px_1px_rgba(255,255,255,0.2)_inset]" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    "Save Key"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
