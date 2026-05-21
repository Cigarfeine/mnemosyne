"use client";
import { useState, useEffect } from "react";
import { memoryAPI, documentsAPI } from "@/lib/api";
import Link from "next/link";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [weakConcepts, setWeakConcepts] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, weakRes, docsRes] = await Promise.all([
          memoryAPI.getStats(),
          memoryAPI.getWeakConcepts(),
          documentsAPI.list()
        ]);
        setStats(statsRes.data);
        setWeakConcepts(weakRes.data.slice(0, 8));
        setDocs(docsRes.data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  if (!stats) return <div className="p-8 text-muted-foreground">Loading analytics...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Your learning performance</p>
        </div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total concepts", value: stats.total_concepts },
          { label: "Avg retention", value: `${Math.round(stats.average_retention * 100)}%` },
          { label: "Mastered", value: stats.mastered_concepts },
          { label: "Due for review", value: stats.due_for_review },
        ].map((s) => (
          <div key={s.label} className="bg-secondary rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-2xl font-medium">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary rounded-xl p-4 col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Overall accuracy</p>
          <p className="text-2xl font-medium">{Math.round((stats.overall_accuracy || 0) * 100)}%</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.total_reviews} total reviews</p>
        </div>
        <div className="bg-secondary rounded-xl p-4 col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Weak concepts</p>
          <p className="text-2xl font-medium text-orange-600">{stats.weak_concepts}</p>
          <p className="text-xs text-muted-foreground mt-1">retention below 40%</p>
        </div>
        <div className="bg-secondary rounded-xl p-4 col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Documents</p>
          <p className="text-2xl font-medium">{docs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{docs.filter((d) => d.status === "ready").length} ready</p>
        </div>
      </div>

      {weakConcepts.length > 0 && (
        <div className="border border-border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-medium mb-4">Weakest concepts</h2>
          <div className="space-y-2">
            {weakConcepts.map((c) => (
              <div key={c.concept_id} className="flex items-center gap-3">
                <span className="text-sm w-32 truncate">{c.concept_name}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${Math.round(c.retention_score * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {Math.round(c.retention_score * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-medium">Documents</h2>
        </div>
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0 hover:bg-secondary/30">
            <div>
              <p className="text-sm font-medium">{doc.title}</p>
              <p className="text-xs text-muted-foreground">{doc.subject} · {doc.total_chunks} chunks</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/study/${doc.id}`}><button className="text-xs border border-border px-3 py-1.5 rounded-lg">Study</button></Link>
              <Link href={`/tutor/${doc.id}`}><button className="text-xs border border-border px-3 py-1.5 rounded-lg">Tutor</button></Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
