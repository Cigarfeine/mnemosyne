"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MagneticButton from '@/components/ui/MagneticButton';
import { cn } from '@/lib/utils';

export default function DropZone() {
  const router = useRouter();
  
  const [pyqFiles, setPyqFiles] = useState<File[]>([]);
  const [notesFiles, setNotesFiles] = useState<File[]>([]);
  const [subject, setSubject] = useState("");
  
  const [isDraggingPYQ, setIsDraggingPYQ] = useState(false);
  const [isDraggingNotes, setIsDraggingNotes] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pyqInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  
  const [apiKey, setApiKey] = useState("");

  // Load API key from local storage on mount
  React.useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Handlers for PYQ Zone
  const handlePYQDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPYQ(true);
  };
  const handlePYQDragLeave = () => setIsDraggingPYQ(false);
  const handlePYQDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPYQ(false);
    if (e.dataTransfer.files) {
      const pdfs = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
      setPyqFiles(prev => [...prev, ...pdfs]);
    }
  };

  // Handlers for Notes Zone
  const handleNotesDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingNotes(true);
  };
  const handleNotesDragLeave = () => setIsDraggingNotes(false);
  const handleNotesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingNotes(false);
    if (e.dataTransfer.files) {
      const pdfs = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
      setNotesFiles(prev => [...prev, ...pdfs]);
    }
  };

  const removePyq = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPyqFiles(prev => prev.filter((_, i) => i !== index));
  };
  const removeNote = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotesFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleGenerate = async () => {
    if (pyqFiles.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("subject", subject || "General Subject");
    
    pyqFiles.forEach(file => formData.append("pyqs", file));
    notesFiles.forEach(file => formData.append("notes", file));

    try {
      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      
      // Save API key
      if (apiKey) {
        localStorage.setItem("gemini_api_key", apiKey);
      }
      
      router.push(`/generate/${data.session_id}`);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      alert("Failed to upload files. Make sure the backend is running.");
    }
  };

  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="w-full flex flex-col">
      {/* Massive PYQ Drop Zone */}
      <div 
        className={cn(
          "relative w-full min-h-[40vh] border-b border-[var(--border)] flex flex-col items-center justify-center p-8 cursor-pointer transition-colors duration-500",
          isDraggingPYQ ? "bg-[var(--accent)] text-black" : "bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--text)]"
        )}
        onDragOver={handlePYQDragOver}
        onDragLeave={handlePYQDragLeave}
        onDrop={handlePYQDrop}
        onClick={() => pyqInputRef.current?.click()}
      >
        <input type="file" multiple accept=".pdf" className="hidden" ref={pyqInputRef} onChange={(e) => {
           if (e.target.files) {
             const pdfs = Array.from(e.target.files).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
             setPyqFiles(prev => [...prev, ...pdfs]);
           }
        }} />

        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-black text-white rounded-full flex items-center justify-center text-4xl font-light mb-6 pointer-events-none transition-transform group-hover:scale-110">
            +
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-[6vw] font-bold tracking-tighter uppercase mb-4 pointer-events-none">
            {isDraggingPYQ ? "DROP IT" : "DRAG PYQS HERE"}
          </h2>
          <div className="flex items-center gap-2 pointer-events-none">
            <span className="px-2 py-1 bg-black text-[var(--accent)] text-xs font-bold uppercase tracking-widest rounded-none">Required</span>
            <span className="text-sm md:text-base font-medium opacity-70">PDF EXAM PAPERS ONLY</span>
          </div>
        </div>

        {/* Selected PYQ Files */}
        {pyqFiles.length > 0 && (
          <div className="absolute bottom-8 left-8 right-8 flex flex-wrap gap-4" onClick={(e) => e.stopPropagation()}>
            {pyqFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-4 border-b-2 border-black pb-1 bg-[var(--bg)] px-4 py-2 rounded-sm shadow-sm">
                <span className="font-mono text-sm max-w-[200px] truncate">{f.name}</span>
                <span className="text-xs opacity-50 font-mono">{formatSize(f.size)}</span>
                <button onClick={(e) => removePyq(i, e)} className="text-black font-bold hover:text-[var(--red)]">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject & Notes Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 w-full border-b border-[var(--border)]">
        
        {/* Subject Input */}
        <div className="col-span-12 md:col-span-6 lg:col-span-8 p-6 md:p-12 border-b md:border-b-0 md:border-r border-[var(--border)] flex flex-col justify-center">
          <div className="relative group/input">
            <label className="text-xs font-bold tracking-widest uppercase mb-4 opacity-50 block transition-all duration-300 group-focus-within/input:-translate-y-1 group-focus-within/input:opacity-100">Subject Name</label>
            <input
              type="text"
              placeholder="E.g. Object Oriented Programming"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-transparent text-2xl md:text-4xl font-medium placeholder-opacity-20 placeholder:text-[var(--text-muted)] focus:outline-none pb-2 relative z-10"
            />
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-focus-within/input:scale-x-100"></div>
          </div>
        </div>

        {/* Add Notes Toggle */}
        <div className="group/btn col-span-12 md:col-span-6 lg:col-span-4 p-6 md:p-12 flex flex-col justify-center cursor-pointer"
             onClick={() => setShowNotes(!showNotes)}>
           <div className="flex items-center justify-between">
             <span className="relative w-fit text-xl md:text-2xl font-medium tracking-tight">
               Add Notes/Slides
               <div className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-black scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover/btn:scale-x-100"></div>
             </span>
             <span className="text-3xl font-light transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover/btn:rotate-180">{showNotes ? "−" : "+"}</span>
           </div>
           <span className="text-sm font-mono opacity-50 mt-2">Optional Context (PDF)</span>
        </div>
      </div>

      {/* Hidden Notes Dropzone with Smooth Slide Down */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-[0.6s] ease-[cubic-bezier(0.76,0,0.24,1)] ${showNotes ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div 
            className={cn(
              "relative w-full min-h-[30vh] border-b border-[var(--border)] flex flex-col items-center justify-center p-8 cursor-pointer transition-colors duration-500",
              isDraggingNotes ? "bg-black text-[var(--accent)]" : "bg-black text-white hover:bg-gray-900"
            )}
            onDragOver={handleNotesDragOver}
            onDragLeave={handleNotesDragLeave}
            onDrop={handleNotesDrop}
            onClick={() => notesInputRef.current?.click()}
          >
            <input type="file" multiple accept=".pdf" className="hidden" ref={notesInputRef} onChange={(e) => {
               if (e.target.files) {
                 const pdfs = Array.from(e.target.files).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
                 setNotesFiles(prev => [...prev, ...pdfs]);
               }
            }} />

            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter mb-2 pointer-events-none">
              {isDraggingNotes ? "DROP NOTES" : "DRAG NOTES HERE"}
            </h2>
            
            {notesFiles.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-4 justify-center" onClick={(e) => e.stopPropagation()}>
                {notesFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-[var(--accent)] pb-1 px-4 py-2">
                    <span className="font-mono text-sm max-w-[200px] truncate text-white">{f.name}</span>
                    <button onClick={(e) => removeNote(i, e)} className="text-[var(--accent)] hover:text-white">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Massive Generate CTA */}
      <MagneticButton 
        onClick={handleGenerate}
        disabled={pyqFiles.length === 0 || isUploading}
        className={cn(
          "group relative w-full py-12 md:py-16 overflow-hidden text-2xl md:text-5xl font-bold uppercase tracking-tighter rounded-none transition-colors duration-[0.8s] ease-[cubic-bezier(0.76,0,0.24,1)]",
          pyqFiles.length === 0 
            ? "bg-[var(--bg-3)] text-[var(--text-muted)] cursor-not-allowed border-none" 
            : "bg-[var(--bg)] text-black hover:bg-black hover:text-white"
        )}
      >
        <div className="relative z-10 flex items-center justify-center gap-4 w-fit mx-auto">
          <span>{isUploading ? "Uploading..." : "Analyse & Generate"}</span>
          {!isUploading && (
             <span className="transition-transform duration-[0.8s] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-4">→</span>
          )}
        </div>
      </MagneticButton>

    </div>
  );
}
