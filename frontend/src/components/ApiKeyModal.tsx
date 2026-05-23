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
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/50"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#DF5830]/10 flex items-center justify-center">
                <Key className="w-6 h-6 text-[#DF5830]" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-800">Setup AI</h2>
                <p className="text-sm text-slate-500 font-medium">Bring your own Groq API Key</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="text-sm text-slate-700 font-medium">Go to the Groq Console</p>
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-sm text-[#DF5830] hover:underline flex items-center gap-1 mt-1 font-medium">
                    console.groq.com/keys <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">2</div>
                <p className="text-sm text-slate-700 font-medium mt-0.5">Click "Create API Key"</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">3</div>
                <div className="w-full">
                  <p className="text-sm text-slate-700 font-medium mt-0.5 mb-2">Paste it here securely</p>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#DF5830] focus:ring-1 focus:ring-[#DF5830] transition-colors text-slate-700"
                  />
                  <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    Your key is stored locally in your browser and is never saved to our database.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
                  isSaved 
                    ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                    : apiKey.trim() 
                      ? "bg-[#1a1a1a] text-white hover:bg-black hover:shadow-md hover:-translate-y-0.5" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
