"use client";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { documentsAPI } from "@/lib/api";
import Link from "next/link";

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
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      setUploading(true);
      setError("");
      try {
        await documentsAPI.upload(files[0], subject);
        await loadDocuments();
      } catch (e: any) {
        setError(e.response?.data?.detail || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
  });

  const statusColor = (status: string) => {
    if (status === "ready") return "text-green-600 bg-green-50";
    if (status === "processing") return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">Mnemosyne</h1>
        <p className="text-muted-foreground mt-2">Cognitive Learning Operating System</p>
      </div>

      <div className="mb-8">
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Subject (e.g. Data Structures)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm w-64 bg-background"
          />
        </div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <p className="text-muted-foreground">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-primary">Drop the PDF here</p>
          ) : (
            <div>
              <p className="text-muted-foreground text-sm">Drag a PDF here, or click to select</p>
              <p className="text-xs text-muted-foreground mt-1">Lecture notes, textbooks, study materials</p>
            </div>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {documents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Documents
          </h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/document/${doc.id}`}>
                <div className="border border-border rounded-xl p-4 hover:bg-secondary/30 transition-colors cursor-pointer flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.subject} · {doc.total_pages} pages · {doc.total_chunks} chunks
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && !uploading && (
        <p className="text-center text-muted-foreground text-sm py-10">
          Upload your first document to begin
        </p>
      )}
    </div>
  );
}
