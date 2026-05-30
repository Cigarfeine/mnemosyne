"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import DOMPurify from "dompurify";

const MermaidChart = ({ chart }: { chart: string }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chartRef.current) {
      // Create a unique ID for the mermaid render to avoid collisions
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      mermaid.render(id, chart).then((result) => {
        if (chartRef.current) {
          chartRef.current.innerHTML = DOMPurify.sanitize(result.svg, { USE_PROFILES: { svg: true } });
        }
      }).catch(e => {
        console.error("Mermaid parsing error:", e);
      });
    }
  }, [chart]);
  return <div ref={chartRef} className="flex justify-center my-8 print:my-4" />;
};

type StepStatus = "pending" | "active" | "complete" | "error";

interface PipelineStep {
  name: string;
  status: StepStatus;
}


export default function ProcessingScreen() {
  const { session_id } = useParams();
  
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  const [showByok, setShowByok] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown).catch(() => {
      console.error("Failed to copy to clipboard");
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };
  
  const [steps, setSteps] = useState<PipelineStep[]>([
    { name: "extracting", status: "pending" },
    { name: "analysing", status: "pending" },
    { name: "mapping", status: "pending" },
    { name: "generating", status: "pending" },
    { name: "complete", status: "pending" },
  ]);

  const isComplete = steps.find(s => s.name === "complete")?.status === "complete";

  const [weightages, setWeightages] = useState<{topics: {name: string, weight: number}[]} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // If user is within 100px of the bottom, keep auto-scrolling
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAutoScroll(isAtBottom);
  };

  useEffect(() => {
    // Smart auto-scroll: only pull down if user hasn't manually scrolled up
    if (isAutoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [markdown, isAutoScroll]);

  useEffect(() => {
    if (!session_id) return;
    
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("No Gemini API key found. Please return and provide one.");
      return;
    }

    const controller = new AbortController();

    const startStream = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/api/generate/stream/${session_id}`, {
          method: "GET",
          headers: {
            "x-api-key": apiKey,
          },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("ReadableStream not yet supported in this browser.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // Keep the last incomplete chunk in the buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "");
              try {
                const payload = JSON.parse(dataStr);
                
                if (payload.type === "step") {
                  setSteps(prev => prev.map(s => {
                    if (s.name === payload.step) return { ...s, status: "active" };
                    // If this step is active, previous steps should be complete
                    const stepOrder = ["extracting", "analysing", "mapping", "generating", "complete"];
                    const currIndex = stepOrder.indexOf(payload.step);
                    const thisIndex = stepOrder.indexOf(s.name);
                    if (thisIndex < currIndex) return { ...s, status: "complete" };
                    return s;
                  }));
                } 
                else if (payload.type === "chunk") {
                  setMarkdown(prev => prev + payload.payload);
                } 
                else if (payload.type === "weightage") {
                  setWeightages(payload.payload);
                }
                else if (payload.type === "done") {
                  setSteps(prev => prev.map(s => ({ ...s, status: "complete" })));
                }
                else if (payload.type === "error") {
                  setError(payload.message);
                  setSteps(prev => prev.map(s => s.status === "active" ? { ...s, status: "error" } : s));
                  if (payload.message.includes("429") || payload.message.includes("quota") || payload.message.includes("RESOURCE_EXHAUSTED")) {
                    setShowByok(true);
                  }
                }
              } catch (e) {
                console.error("Error parsing SSE:", dataStr);
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Connection to engine lost.");
        } else if (typeof err === "string") {
          setError(err);
        }
      }
    };

    startStream();

    return () => {
      controller.abort();
    };
  }, [session_id, retryTrigger]);

  return (
    <div className="w-full h-screen bg-[#F4F4F0] text-black flex flex-col md:flex-row overflow-hidden font-sans print:h-auto print:overflow-visible pt-[72px]">
      {/* Left Sidebar: Tracker (30%) */}
      <div className="w-full md:w-[30%] h-auto md:h-full border-b md:border-b-0 md:border-r border-black p-8 flex flex-col bg-white print:hidden">

        
        <h2 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-8">
          Pipeline Status
        </h2>
        
        <div className="flex flex-col gap-6 flex-grow">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full border border-black flex items-center justify-center">
                 {step.status === "active" && <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />}
                 {step.status === "complete" && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                 {step.status === "error" && <div className="w-1.5 h-1.5 bg-[var(--red)] rounded-full" />}
              </div>
              <span className={`text-xl md:text-3xl font-bold uppercase tracking-tighter ${
                step.status === "active" ? "text-black" : 
                step.status === "complete" ? "text-black opacity-30 line-through" : 
                step.status === "error" ? "text-[var(--red)]" : "text-black opacity-10"
              }`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-8 flex flex-col gap-2">
            <div className="p-4 bg-[var(--red)] text-white text-sm font-mono font-medium max-h-[40vh] overflow-y-auto">
              ERROR: {error}
            </div>
            <button 
              onClick={() => {
                setMarkdown("");
                setError(null);
                setSteps([
                  { name: "extracting", status: "pending" },
                  { name: "analysing", status: "pending" },
                  { name: "mapping", status: "pending" },
                  { name: "generating", status: "pending" },
                  { name: "complete", status: "pending" },
                ]);
                setRetryTrigger(prev => prev + 1);
              }}
              className="w-full bg-black text-white px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-colors"
            >
              Retry Pipeline
            </button>
          </div>
        )}

        {weightages && weightages.topics && (
          <div className="mt-auto pt-8 border-t border-black">
             <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Topic Weightages</h3>
             <div className="flex flex-col gap-2 max-h-[20vh] overflow-y-auto pr-2">
               {weightages.topics.map((t: {name: string, weight: number}, i: number) => (
                 <div key={i} className="flex items-center justify-between text-sm">
                   <span className="font-medium truncate max-w-[70%]">{t.name}</span>
                   <span className="font-mono">{t.weight}%</span>
                 </div>
               ))}
             </div>
          </div>
        )}

        {isComplete && (
          <div className={`flex flex-col gap-3 ${!(weightages && weightages.topics) ? 'mt-auto' : 'mt-8'}`}>
            <button 
              onClick={handleCopy}
              className="w-full bg-white text-black border-2 border-black px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              {copied ? "COPIED!" : "Copy Text"}
            </button>
            <button 
              onClick={handlePrint}
              className="w-full bg-black text-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-colors border-2 border-black"
            >
              Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Right Area: Streaming Output (70%) */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        data-lenis-prevent="true"
        className="w-full md:w-[70%] h-full overflow-y-auto p-8 md:p-16 bg-[#F4F4F0] print:h-auto print:overflow-visible print:w-full print:p-0"
      >
        {!markdown && !error ? (
           <div className="h-full flex items-center justify-center opacity-10 text-4xl font-bold tracking-tighter uppercase print:hidden">
             Waiting for stream...
           </div>
        ) : (
          <div className="relative max-w-4xl mx-auto">
            
            {/* Removed inline action bar - Moved to sidebar */}

            <article className="prose prose-lg prose-black w-full max-w-none
              prose-headings:font-bold prose-headings:tracking-tighter prose-headings:uppercase
              prose-h1:text-5xl prose-h2:text-3xl prose-h3:text-xl
              prose-p:text-lg prose-p:leading-relaxed
              prose-strong:font-bold
              prose-a:border-b prose-a:border-black prose-a:no-underline
              prose-li:marker:text-black">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match && match[1] === 'mermaid') {
                      return <MermaidChart chart={String(children).replace(/\n$/, '')} />;
                    }
                    return <code className={className} {...props}>{children}</code>;
                  }
                }}
              >
                {markdown}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </div>

      {/* BYOK Modal for Rate Limits */}
      {showByok && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 print:hidden">
          <div className="bg-[#F4F4F0] border-2 border-black p-8 md:p-12 w-full max-w-xl shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">Quota Exceeded</h3>
            <p className="text-lg mb-8 font-medium opacity-80">The current API key has hit its limit. Drop in your own Gemini Developer key to continue right where it left off.</p>
            
            <div className="relative group/input mb-10">
              <label className="text-xs font-bold tracking-widest uppercase mb-2 opacity-50 block">Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full bg-transparent text-xl md:text-2xl font-mono placeholder-opacity-20 placeholder:text-[var(--text-muted)] focus:outline-none pb-2 relative z-10 border-b-2 border-black/20 focus:border-black transition-colors"
              />
              <p className="text-xs opacity-50 font-mono mt-2 flex justify-between">
                <span>Stored locally. Never hits a database.</span>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--red)]">Get one here</a>
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  if (!newKey) return;
                  localStorage.setItem("gemini_api_key", newKey);
                  setShowByok(false);
                  setMarkdown("");
                  setError(null);
                  setSteps([
                    { name: "extracting", status: "pending" },
                    { name: "analysing", status: "pending" },
                    { name: "mapping", status: "pending" },
                    { name: "generating", status: "pending" },
                    { name: "complete", status: "pending" },
                  ]);
                  setRetryTrigger(prev => prev + 1);
                }}
                className="flex-1 bg-black text-[var(--accent)] px-8 py-4 text-lg md:text-xl font-bold uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-colors border-2 border-black"
              >
                Resume Run
              </button>
              <button 
                onClick={() => setShowByok(false)}
                className="bg-transparent text-black border-2 border-black px-8 py-4 text-lg md:text-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
