"use client";
import { useState, useEffect } from "react";
import { memoryAPI, documentsAPI } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrainCircuit, Target, TrendingUp, BookOpen, AlertTriangle, ArrowRight, Activity, Zap, CircleDot } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [weakConcepts, setWeakConcepts] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500/50" />
        <p>Failed to load analytics data.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">Retry</button>
      </div>
    );
  }

  // Data for Knowledge Distribution Pie Chart
  const learningConcepts = stats.total_concepts - stats.mastered_concepts - stats.due_for_review;
  const pieData = [
    { name: "Mastered", value: stats.mastered_concepts || 0, color: "#10b981" }, // Emerald 500
    { name: "Learning", value: learningConcepts > 0 ? learningConcepts : 0, color: "#6366f1" }, // Indigo 500
    { name: "Due Review", value: stats.due_for_review || 0, color: "#f59e0b" }, // Amber 500
  ];
  
  // Only show pie chart if there are concepts, otherwise show empty state data
  const hasPieData = pieData.some(d => d.value > 0);
  const displayPieData = hasPieData ? pieData : [{ name: "No Data", value: 1, color: "#334155" }];

  // Data for Weak Concepts Bar Chart
  const barData = weakConcepts.map(c => ({
    name: c.concept_name.length > 15 ? c.concept_name.substring(0, 15) + "..." : c.concept_name,
    retention: Math.round(c.retention_score * 100),
    fullName: c.concept_name
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="max-w-6xl mx-auto pt-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 pt-8"
      >
        <div>
          <h1 className="text-5xl md:text-7xl lg:text-[90px] font-sans font-black text-[#1a1a1a] tracking-tighter mb-6 leading-[0.95]">
            <span className="font-serif italic font-medium pr-2">Learning</span> Analytics.
          </h1>
          <p className="text-slate-600 text-lg md:text-2xl max-w-2xl font-medium leading-relaxed">
            Track your cognitive retention and understand your knowledge distribution.
          </p>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: "Total Concepts", value: stats.total_concepts, icon: BrainCircuit, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Avg Retention", value: `${Math.round(stats.average_retention * 100)}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Overall Accuracy", value: `${Math.round((stats.overall_accuracy || 0) * 100)}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Weak Concepts", value: stats.weak_concepts, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100" },
        ].map((s, i) => (
          <motion.div key={i} variants={itemVariants} className="bg-white/60 backdrop-blur-md rounded-[24px] p-6 border border-slate-200/60 shadow-soft flex flex-col justify-between">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-full ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-serif italic text-[#1a1a1a] tracking-tight mb-2 pr-2">{s.value}</p>
              <p className="text-xs uppercase tracking-widest font-bold text-slate-500">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Moved Study Library directly beneath the stat cards so it's prioritized */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
        <div className="mb-6">
          <h2 className="text-4xl font-serif text-[#1a1a1a] tracking-tight">
            Study Library
          </h2>
        </div>
        
        {docs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {docs.map((doc) => (
              <div key={doc.id} className="bg-white/60 backdrop-blur-md rounded-[24px] p-6 border border-slate-200/80 shadow-sm hover:bg-white/90 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <p className="font-serif italic font-medium text-3xl text-[#1a1a1a] mb-2 pr-2">{doc.title}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-full">{doc.subject}</span>
                    <span>{doc.total_chunks} learning blocks</span>
                    {doc.status === "ready" && (
                      <span className="flex items-center gap-1.5 text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Ready to study
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href={`/tutor/${doc.id}`} className="w-full md:w-auto">
                    <button className="w-full md:w-auto px-6 py-2.5 rounded-full text-sm font-bold bg-white text-slate-900 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                      <BrainCircuit className="w-4 h-4" />
                      AI Tutor
                    </button>
                  </Link>
                  <Link href={`/study/${doc.id}`} className="w-full md:w-auto">
                    <button className="w-full md:w-auto px-6 py-2.5 rounded-full text-sm font-bold bg-[#f8a8b8] hover:bg-[#f292a5] text-slate-900 shadow-sm transition-all flex items-center justify-center gap-2">
                      Study Now
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-slate-500 font-medium">
            No documents uploaded yet. Go to the dashboard to add some!
          </div>
        )}
      </motion.div>

      {/* Analytics Charts moved to the bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24">
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white/60 backdrop-blur-md rounded-[32px] p-8 lg:p-10 lg:col-span-1 flex flex-col border border-slate-200/60 shadow-soft">
          <h2 className="text-3xl font-serif text-[#1a1a1a] tracking-tight mb-8">
            Knowledge Distribution
          </h2>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {hasPieData && <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'white', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-bold text-slate-600">{entry.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white/60 backdrop-blur-md rounded-[32px] p-8 lg:p-10 lg:col-span-2 border border-slate-200/60 shadow-soft">
          <h2 className="text-3xl font-serif text-[#1a1a1a] tracking-tight mb-8">
            Retention by Weakest Concepts
          </h2>
          {barData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" tick={{fill: '#64748b'}} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{fill: '#64748b'}} width={100} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    contentStyle={{ backgroundColor: 'white', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#0f172a', marginBottom: '4px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="retention" name="Retention %" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.retention < 40 ? '#f43f5e' : entry.retention < 70 ? '#f59e0b' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center flex-col text-slate-500">
              <AlertTriangle className="w-10 h-10 mb-3 opacity-20" />
              <p>No weak concepts identified yet.</p>
              <p className="text-sm">Complete some reviews to generate this data.</p>
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}
