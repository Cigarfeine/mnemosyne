"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { aiAPI } from "@/lib/api";
import { Wifi, WifiOff, AlertTriangle, Cpu, ArrowRight, Sparkles } from "lucide-react";

const navLinks = [
  { href: "/", label: "Documents" },
  { href: "/analytics", label: "Analytics" },
  { href: "/contact", label: "Talk to us" },
];

type AIStatus = "healthy" | "rate_limited" | "invalid_key" | "error" | "checking";

export default function Nav() {
  const path = usePathname();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus>("checking");
  const [aiProvider, setAiProvider] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await aiAPI.health();
      setAiStatus(res.data.status as AIStatus);
      setAiProvider(res.data.provider);
      setAiMessage(res.data.message);
    } catch {
      setAiStatus("error");
      setAiMessage("Backend not reachable");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    checking: { color: "text-slate-400", bg: "bg-slate-500", pulse: true, icon: Cpu },
    healthy: { color: "text-emerald-400", bg: "bg-emerald-500", pulse: false, icon: Wifi },
    rate_limited: { color: "text-amber-400", bg: "bg-amber-500", pulse: true, icon: AlertTriangle },
    invalid_key: { color: "text-rose-400", bg: "bg-rose-500", pulse: false, icon: WifiOff },
    error: { color: "text-rose-400", bg: "bg-rose-500", pulse: false, icon: WifiOff },
  };

  const config = statusConfig[aiStatus];
  const StatusIcon = config.icon;

  return (
    <>
      <motion.nav className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-5xl z-50 rounded-[24px] sm:rounded-full bg-gradient-to-b from-white/80 to-white/50 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.15),_0_1px_3px_rgba(255,255,255,0.8)_inset,_0_0_0_1px_rgba(255,255,255,0.3)_inset] px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between border border-white/40">
        <Link href="/" className="font-serif italic font-medium tracking-tight text-lg sm:text-2xl text-[#1a1a1a] ml-1 sm:ml-2 hover:opacity-70 transition-opacity">
          Mnemosyne
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <div 
            className="flex gap-1 sm:gap-2 mr-1 sm:mr-6 relative"
            onMouseLeave={() => setHoveredPath(null)}
          >
            {navLinks.map((link) => {
              const isActive = path === link.href;
              const isHovered = hoveredPath === link.href;
              const hasPill = hoveredPath ? isHovered : isActive;

              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onMouseEnter={() => setHoveredPath(link.href)}
                  className={`relative text-[10px] sm:text-sm font-bold px-3 py-2 sm:px-5 sm:py-2.5 rounded-full transition-colors flex items-center justify-center group ${
                    link.href === "/contact" ? "bg-[#f8a8b8] shadow-sm ml-1" : ""
                  } ${
                    hasPill 
                      ? (link.href === "/contact" ? "text-[#f8a8b8]" : "text-white") 
                      : (link.href === "/contact" ? "text-slate-900" : "text-slate-500")
                  }`}
                >
                  {hasPill && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-[#1a1a1a] rounded-full shadow-soft"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    {link.label}
                    {link.href === "/contact" && (
                      <div className={`relative overflow-hidden w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center -mr-1 sm:-mr-1.5 transition-colors duration-300 ${hasPill ? "bg-[#f8a8b8]/20" : "bg-white/50"}`}>
                        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.84,0.16,0.14,1)] group-hover:rotate-45 group-hover:-translate-y-[150%] group-hover:translate-x-[150%]">
                          <ArrowRight className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-colors duration-300 ${hasPill ? "text-[#f8a8b8]" : "text-[#1a1a1a]"}`} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.84,0.16,0.14,1)] translate-y-[150%] -translate-x-[150%] -rotate-45 group-hover:translate-y-0 group-hover:translate-x-0 group-hover:rotate-0">
                          <ArrowRight className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-colors duration-300 ${hasPill ? "text-[#f8a8b8]" : "text-[#1a1a1a]"}`} />
                        </div>
                      </div>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="relative ml-2">
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              aria-label="AI Status"
              className={`flex items-center gap-1.5 sm:gap-3 px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-full border border-slate-200/80 transition-all shadow-sm bg-white/60 backdrop-blur-md hover:bg-white/90 hover:shadow-md ${aiStatus === "rate_limited" ? "animate-pulse" : ""}`}
            >
              <StatusIcon className={`w-3.5 h-3.5 hidden sm:block ${config.color}`} />
              <span className={`text-xs font-medium ${config.color} hidden sm:inline`}>
                Groq AI
              </span>
              <div className={`w-2 h-2 rounded-full ${config.bg} ${config.pulse ? "animate-pulse" : ""}`} />
            </button>

            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-64 p-5 rounded-[24px] bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-soft z-50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.bg}`} />
                    <span className="text-sm font-semibold text-slate-800 capitalize">{aiStatus.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{aiMessage || "Checking..."}</p>
                  {(aiStatus === "invalid_key" || aiStatus === "error") && (
                    <p className="text-xs text-amber-600 mt-2 pt-2 border-t border-slate-100">
                      💡 Add your API key to backend/.env
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {aiStatus === "rate_limited" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[5.5rem] left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-40 bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl px-5 py-3 flex items-center gap-3"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-200 font-medium">
              <span className="text-amber-400 font-bold">API Quota Warning:</span> {aiMessage}. AI features will retry automatically.
            </p>
            <button onClick={() => setAiStatus("checking")} className="ml-auto text-amber-400 hover:text-white text-xs font-medium px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(aiStatus === "invalid_key" || aiStatus === "error") && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[5.5rem] left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-40 bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 rounded-2xl px-5 py-3 flex items-center gap-3"
          >
            <WifiOff className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <p className="text-xs text-rose-200 font-medium">
              <span className="text-rose-400 font-bold">AI Offline:</span> {aiMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
