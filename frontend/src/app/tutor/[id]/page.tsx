"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { tutorAPI } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BrainCircuit, Send, Sparkles, Target } from "lucide-react";
import ShinyText from "@/components/reactbits/ShinyText";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
export default function TutorPage() {
  const params = useParams();
  const docId = params.id as string;
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [studyMode, setStudyMode] = useState<"notes" | "pyq">("notes");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current?.parentElement) {
      const container = bottomRef.current.parentElement;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const groqKey = localStorage.getItem("mnemosyne_groq_key");
      let deviceId = localStorage.getItem("mnemosyne_device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("mnemosyne_device_id", deviceId);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/tutor/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": deviceId,
          "X-Groq-Api-Key": groqKey || ""
        },
        body: JSON.stringify({
          message: msg,
          document_id: docId,
          session_id: sessionId,
          study_mode: studyMode
        })
      });

      if (!response.ok) throw new Error("Failed to chat");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      let rawText = "";
      let isFirstChunk = true;

      if (reader) {
        setMessages((m) => [...m, { role: "assistant", content: "" }]);
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          rawText += decoder.decode(value, { stream: true });
          
          const cleanedText = rawText.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim();
          
          if (cleanedText !== "") {
            if (isFirstChunk) {
              setLoading(false);
              isFirstChunk = false;
            }
            
            setMessages((m) => {
              const newM = [...m];
              newM[newM.length - 1].content = cleanedText;
              return newM;
            });
          }
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto z-10 relative bg-white/60 backdrop-blur-md rounded-[32px] border border-slate-200/60 shadow-soft overflow-hidden mb-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 border-b border-slate-200/50 px-4 py-4 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6"
      >
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href={`/document/${docId}`} className="p-2.5 sm:p-3 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="flex items-center gap-3 ml-1 sm:ml-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-lg sm:text-base leading-tight">
                <ShinyText text="AI Tutor" disabled={false} speed={2} color="#DF5830" shineColor="#f2663c" className="inline-block" />
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 flex items-start sm:items-center gap-1 font-medium mt-0.5 sm:mt-0 leading-tight">
                <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5 sm:mt-0" />
                <span>Context-aware · Knows your weak areas</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200 w-full sm:w-auto shrink-0 relative">
          {(["notes", "pyq"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStudyMode(tab)}
              className={`relative flex-1 sm:flex-none text-center text-xs font-bold px-6 py-2 sm:py-1.5 rounded-full transition-colors duration-300 z-10 ${
                studyMode === tab ? "text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {studyMode === tab && (
                <motion.div
                  layoutId="studyModeTab"
                  className={`absolute inset-0 rounded-full shadow-sm -z-10 ${tab === "notes" ? "bg-primary" : "bg-amber-500"}`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab === "notes" ? "Notes" : "PYQ"}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 bg-transparent scrollbar-hide">
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-center text-slate-500 max-w-sm mx-auto"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
              <BrainCircuit className="w-10 h-10 text-primary opacity-80" />
            </div>
            <p className="text-4xl font-serif italic text-[#1a1a1a] pr-2 mb-2">Ask me anything</p>
            <p className="text-slate-500 font-medium">I have read your document. I know your weak concepts and will focus on what you need most.</p>
          </motion.div>
        )}
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mr-3 flex-shrink-0 mt-1">
                <BrainCircuit className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-[24px] px-6 py-4 text-base leading-relaxed shadow-sm
              ${msg.role === "user"
                ? "bg-[#1a1a1a] text-white rounded-br-sm"
                : "bg-white/80 backdrop-blur-md text-slate-800 rounded-bl-sm border border-slate-200/50"}`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 prose-li:marker:text-primary prose-strong:text-slate-900">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start items-start"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 mr-3 flex-shrink-0 mt-1 relative overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-primary/20"
                animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <BrainCircuit className="w-4 h-4 text-primary relative z-10" />
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-[24px] rounded-bl-sm px-5 py-3.5 border border-slate-200/50 shadow-sm flex items-center gap-3 overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                <motion.div 
                  className="absolute inset-0 border-2 border-slate-200 border-t-primary rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <ShinyText text="Deep reasoning in progress..." disabled={false} speed={2.5} color="#64748b" shineColor="#0f172a" className="text-sm font-medium tracking-wide" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 border-t border-slate-200/50 p-6 relative z-10"
      >
        <div className="flex gap-3 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about any concept..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full pl-6 pr-14 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:hover:bg-[#1a1a1a] transition-all shadow-soft"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
