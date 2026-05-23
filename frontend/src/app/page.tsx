"use client";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { documentsAPI } from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Layers, CheckCircle2, Clock, AlertCircle, Trash2 } from "lucide-react";
import ShinyText from "@/components/reactbits/ShinyText";

interface Document {
  id: string;
  title: string;
  subject: string;
  status: string;
  total_pages: number;
  total_chunks: number;
  created_at: string;
}

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState("General");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDocuments();
    const interval = setInterval(loadDocuments, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await documentsAPI.list();
      setDocuments(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      if (files.length === 0) return;
      
      const validFiles = files.filter(f => f.name.toLowerCase().endsWith(".pdf"));
      if (validFiles.length === 0) {
        setError("Only PDF files are supported");
        return;
      }

      setUploading(true);
      setError("");
      try {
        await Promise.all(validFiles.map(file => documentsAPI.upload(file, subject)));
        await loadDocuments();
      } catch (e: any) {
        setError(e.response?.data?.detail || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await documentsAPI.delete(id);
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch (e) {
      console.error("Failed to delete document:", e);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "ready") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (status === "processing") return <Clock className="w-4 h-4 text-amber-600 animate-spin-slow" />;
    return <AlertCircle className="w-4 h-4 text-rose-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "ready") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "processing") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-16 text-left pt-12"
      >
        <h1 className="text-6xl md:text-8xl lg:text-[110px] font-sans font-black text-[#1a1a1a] tracking-tighter mb-8 leading-[0.95]">
          <span className="font-serif italic font-medium tracking-tight pr-2">Unearth</span> your advantage.<br />
          Transform for <span className="font-serif italic font-medium tracking-tight">growth.</span>
        </h1>
        <p className="text-slate-600 text-lg md:text-2xl max-w-3xl font-medium leading-relaxed">
          Your brain is your strongest competitive advantage. We'll help you organise your study materials, embed it deeply, and transform it into genuine momentum.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-12"
      >
          <div
            {...getRootProps()}
            className={`relative overflow-hidden p-16 text-center cursor-pointer transition-all duration-300 w-full h-full rounded-[32px] border border-slate-200/60
              ${isDragActive 
                ? "bg-[#f8a8b8]/10 scale-[1.02] border-[#f8a8b8]" 
                : "bg-white/60 backdrop-blur-md hover:bg-white/80 shadow-soft"}`}
          >
            <input {...getInputProps()} />
            
            <AnimatePresence mode="wait">
              {uploading ? (
                <motion.div 
                  key="uploading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mb-4" />
                  <p className="text-lg font-bold text-slate-900 animate-pulse">Processing document...</p>
                </motion.div>
              ) : isDragActive ? (
                <motion.div 
                  key="dragActive"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 rounded-full bg-[#f8a8b8]/20 flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <div className="w-14 h-14 rounded-full bg-[#f8a8b8] flex items-center justify-center shadow-lg">
                      <UploadCloud className="w-6 h-6 text-slate-900" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-serif text-[#f8a8b8] tracking-tight">Drop it here!</h3>
                </motion.div>
              ) : (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#f8a8b8]/20 transition-all">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-[#f8a8b8] group-hover:text-slate-900 transition-colors">
                      <UploadCloud className="w-6 h-6 text-slate-900" />
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-serif text-[#1a1a1a] tracking-tight">
                    Upload your materials
                  </h3>
                  <p className="text-slate-500 font-medium text-lg">
                    Drag and drop your PDFs, notes, or books here.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        
        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-rose-400 text-sm mt-3 text-center font-medium"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <div>
        <div className="flex items-end justify-between mb-8 pb-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif text-[#1a1a1a] tracking-tight mb-2">
              Your Library
            </h2>
            <p className="text-slate-500 font-medium text-lg">Manage and review your processed materials.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-md px-5 py-2 rounded-full border border-slate-200/80 shadow-sm text-sm font-bold text-slate-900">
            {documents.length} {documents.length === 1 ? 'Item' : 'Items'}
          </div>
        </div>

        {documents.length > 0 ? (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {documents.map((doc, index) => (
                <motion.div 
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Link href={`/document/${doc.id}`}>
                    <div className="bg-white/60 backdrop-blur-md rounded-[24px] p-6 cursor-pointer border border-slate-200/80 shadow-sm hover:bg-white/90 hover:shadow-md transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-5 relative z-10 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 shadow-sm">
                          <FileText className="w-6 h-6 text-slate-800" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif italic font-medium text-3xl text-[#1a1a1a] truncate mb-1 pr-2">{doc.title}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 font-medium">
                            <span className="bg-white border border-slate-200 px-3 py-1 rounded-full">{doc.subject}</span>
                            <span>{doc.total_pages} pages</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 relative z-10">
                        <div className={`flex items-center gap-2 text-xs px-4 py-2 rounded-full border ${getStatusColor(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          <span className="font-semibold capitalize tracking-wider">{doc.status}</span>
                        </div>
                        <button 
                          onClick={(e) => handleDelete(e, doc.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          !uploading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-20 bg-white/60 backdrop-blur-md rounded-[32px] border border-slate-200/60 shadow-soft"
            >
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <UploadCloud className="w-6 h-6 text-slate-900" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-serif text-[#1a1a1a] tracking-tight mb-3">
                    Upload your materials
                  </h3>
                  <p className="text-slate-500 font-medium text-lg">
                    Drag and drop your PDFs, notes, or books here.
                  </p>
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}
