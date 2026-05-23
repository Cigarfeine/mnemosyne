"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactFlow, {
  Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState
} from "reactflow";
import "reactflow/dist/style.css";
import { documentsAPI, conceptsAPI, recallAPI, aiAPI } from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, BrainCircuit, BookOpen, Activity, Zap, FileText, Target, Clock, Sparkles, Search } from "lucide-react";
import ShinyText from "@/components/reactbits/ShinyText";

const ConceptNode = ({ data }: { data: any }) => {
  const difficultyColor = ["", "bg-emerald-50 text-emerald-600 border-emerald-200", "bg-blue-50 text-blue-600 border-blue-200", "bg-yellow-50 text-yellow-600 border-yellow-200", "bg-orange-50 text-orange-600 border-orange-200", "bg-rose-50 text-rose-600 border-rose-200"][data.difficulty] || "bg-white text-slate-700 border-slate-200";
  return (
    <div className={`px-4 py-3 rounded-xl border shadow-sm min-w-[140px] max-w-[200px] ${difficultyColor}`}>
      <p className="font-semibold text-sm leading-tight text-slate-800 mb-1">{data.label}</p>
      <p className="text-[10px] uppercase tracking-wider font-medium opacity-80">{data.category}</p>
    </div>
  );
};

const nodeTypes = { conceptNode: ConceptNode };

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [doc, setDoc] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [filteredConcepts, setFilteredConcepts] = useState<any[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [extracting, setExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<"graph" | "list">("graph");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionETA, setExtractionETA] = useState(0);
  const [extractionStartTime, setExtractionStartTime] = useState<number | null>(null);
  const [extractionElapsed, setExtractionElapsed] = useState(0);

  useEffect(() => {
    loadDocument();
    loadGraph();
  }, [docId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConcepts(concepts);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredConcepts(concepts.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.definition?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, concepts]);

  useEffect(() => {
    if (!extracting || !extractionStartTime) return;
    const timer = setInterval(() => {
      setExtractionElapsed(Math.floor((Date.now() - extractionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [extracting, extractionStartTime]);

  const loadDocument = async () => {
    try {
      const res = await documentsAPI.get(docId);
      setDoc(res.data);
    } catch (e) {
      console.error("Failed to load document", e);
    }
  };

  const loadGraph = async () => {
    try {
      const res = await conceptsAPI.getGraph(docId);
      setNodes(res.data.nodes || []);
      setEdges(res.data.edges || []);

      const conceptRes = await conceptsAPI.list(docId);
      setConcepts(conceptRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const triggerExtraction = async () => {
    setExtracting(true);
    setExtractionStartTime(Date.now());
    setExtractionProgress(0);
    setExtractionElapsed(0);
    
    const totalChunks = doc?.total_chunks || 10;
    setExtractionETA(totalChunks * 8);

    try {
      await conceptsAPI.extract(docId);
      
      // Poll for progress
      const poll = setInterval(async () => {
        try {
          const [conceptRes, progressRes] = await Promise.all([
            conceptsAPI.list(docId),
            aiAPI.extractionProgress(docId).catch(() => null),
          ]);
          
          if (progressRes?.data) {
            setExtractionProgress(progressRes.data.progress_percent);
            setExtractionETA(progressRes.data.estimated_seconds_remaining);
          }
          
          if (conceptRes.data.length > 0) {
            clearInterval(poll);
            setExtracting(false);
            setExtractionProgress(100);
            await loadGraph();
            // Auto-generate questions
            try {
              await recallAPI.generateQuestions(docId, "notes");
            } catch (e) {
              console.error("Question generation failed:", e);
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 3000);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Extraction failed");
      setExtracting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this document? All extracted concepts and memories will be lost.")) {
      try {
        await documentsAPI.delete(docId);
        router.push("/");
      } catch (e) {
        alert("Failed to delete document");
      }
    }
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    const concept = concepts.find((c) => c.id === node.id);
    setSelectedConcept(concept || null);
  }, [concepts]);

  if (loading || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#f8a8b8]/30 border-t-[#f8a8b8] animate-spin" />
      </div>
    );
  } return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-14rem)] bg-white/60 backdrop-blur-md rounded-[32px] overflow-hidden border border-slate-200/60 shadow-soft"
    >
      {/* Header */}
      <div className="border-b border-slate-200/50 px-4 sm:px-8 py-4 sm:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 bg-white/40 relative z-10">
        <div className="flex items-start md:items-center gap-3 sm:gap-6 w-full md:w-auto">
          <Link href="/" className="p-2 sm:p-3 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors mt-1 md:mt-0 flex-shrink-0">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif italic text-[#1a1a1a] tracking-tight flex items-center gap-3 pr-2 truncate">
              {doc.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-[10px] sm:text-xs font-medium text-slate-500">
              <span className="bg-primary/10 text-primary px-2 sm:px-2.5 py-0.5 rounded-full border border-primary/20">{doc.subject}</span>
              <span className="flex items-center gap-1"><FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {doc.total_pages} pages</span>
              <span className="flex items-center gap-1"><BrainCircuit className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {doc.total_chunks} chunks</span>
              {concepts.length > 0 && (
                <span className="flex items-center gap-1 text-emerald-600"><Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {concepts.length} concepts</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
          {concepts.length === 0 && !extracting && (
            <button
              onClick={triggerExtraction}
              disabled={extracting}
              className="flex flex-1 md:flex-none items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-primary hover:bg-[#f2663c] text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold transition-colors shadow-glow-primary disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Extract Concepts</span><span className="sm:hidden">Extract</span>
            </button>
          )}
          
          <Link href={`/study/${docId}?mode=notes`} className="flex flex-1 md:flex-none items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold transition-colors">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" /> Notes
          </Link>
          <Link href={`/study/${docId}?mode=pyq`} className="flex flex-1 md:flex-none items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold transition-colors shadow-sm">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> PYQ
          </Link>
          
          <Link href={`/tutor/${docId}`} className="flex flex-1 md:flex-none items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-[#f8a8b8] hover:bg-[#f292a5] text-slate-900 shadow-sm px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold transition-colors">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" /> Tutor
          </Link>

          <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>

          <button 
            onClick={handleDelete}
            className="p-2 sm:p-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 transition-colors ml-auto md:ml-0"
            title="Remove Document"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {extracting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-slate-100 bg-primary/5 px-6 py-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <BrainCircuit className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">AI is analyzing your document...</p>
                  <p className="text-xs text-slate-500">Extracting concepts, definitions, and relationships</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Elapsed: <span className="text-slate-700 font-mono font-semibold">{formatTime(extractionElapsed)}</span>
                </span>
                {extractionETA > 0 && (
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    ETA: <span className="text-slate-700 font-mono font-semibold">~{formatTime(extractionETA)}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "2%" }}
                animate={{ width: `${Math.max(extractionProgress, 5)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <span>Processing chunks</span>
              <span>{extractionProgress}% complete</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200/50 px-4 sm:px-8 bg-white/40 relative z-10 gap-3 sm:gap-0 pt-2 sm:pt-0 pb-2 sm:pb-0">
        <div className="flex overflow-x-auto w-full sm:w-auto scrollbar-hide">
          {(["graph", "list"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm py-4 px-4 font-semibold transition-all relative ${
                activeTab === tab ? "text-primary" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "graph" ? `Knowledge Graph (${concepts.length})` : "Concept List"}
              {activeTab === tab && (
                <motion.div layoutId="docActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
        
        {/* Search bar in list view */}
        {activeTab === "list" && concepts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-40"
            />
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === "graph" ? (
          <>
            <div className="flex-1 relative z-0">
              {nodes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 relative z-10">
                  <div className="text-center bg-white shadow-soft p-8 rounded-2xl max-w-md border border-slate-200">
                    <BrainCircuit className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-bold text-slate-800 mb-2">No concepts mapped</p>
                    <p className="text-sm">Click <span className="text-primary font-semibold">Extract Concepts</span> to let the AI analyze this document and generate a learning graph.</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-transparent">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                  >
                    <Background color="rgba(0,0,0,0.05)" gap={20} size={1} />
                    <Controls className="bg-white border-slate-200 fill-slate-700 rounded-xl overflow-hidden shadow-sm m-4" />
                  </ReactFlow>
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {selectedConcept && (
                  <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute inset-y-0 right-0 md:relative w-full md:w-80 border-l border-slate-200/50 bg-white/95 md:bg-white/80 backdrop-blur-md p-6 sm:p-8 overflow-y-auto z-50 md:z-10 shadow-2xl"
                >
                  <div className="flex items-start justify-between mb-6">
                    <h3 className="text-3xl font-serif italic text-[#1a1a1a] leading-tight pr-2">{selectedConcept.name}</h3>
                    <button onClick={() => setSelectedConcept(null)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
                      ×
                    </button>
                  </div>
                  
                  <span className="inline-block text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md mb-6 uppercase tracking-wider">
                    {selectedConcept.category}
                  </span>
                  
                  <div className="prose prose-sm">
                    <p className="text-slate-600 leading-relaxed text-sm">{selectedConcept.definition}</p>
                  </div>
                  
                  {selectedConcept.prerequisites?.length > 0 && (
                    <div className="mt-8">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Prerequisites</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedConcept.prerequisites.map((p: string) => (
                          <span key={p} className="text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Complexity</p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Zap key={i} className={`w-4 h-4 ${i <= selectedConcept.difficulty ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Quick actions for selected concept */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2">
                    <Link 
                      href={`/tutor/${docId}`}
                      className="text-xs font-bold bg-primary text-white shadow-glow-primary px-3 py-3 rounded-full hover:bg-[#f2663c] transition-colors text-center"
                    >
                      Ask AI Tutor about this →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 pb-16 relative z-10 bg-transparent">
            {filteredConcepts.length === 0 && searchQuery ? (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No concepts match &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                {filteredConcepts.map((c) => (
                  <motion.div 
                    key={c.id}
                    whileHover={{ y: -2 }}
                    className="bg-white/60 backdrop-blur-md rounded-[24px] p-6 cursor-pointer border border-slate-200/80 shadow-sm hover:bg-white/90 hover:shadow-md hover:border-slate-300/80 transition-colors transition-shadow flex flex-col justify-between"
                    onClick={() => { setSelectedConcept(c); setActiveTab("graph"); }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-serif italic text-2xl text-[#1a1a1a] pr-2">{c.name}</p>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-white px-2.5 py-1 rounded-full border border-slate-200">{c.category}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{c.definition}</p>
                    <div className="flex items-center gap-1 mt-3">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= c.difficulty ? 'bg-amber-500' : 'bg-slate-200'}`} />
                      ))}
                      <span className="text-[10px] text-slate-400 ml-1 font-semibold uppercase">Difficulty</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
