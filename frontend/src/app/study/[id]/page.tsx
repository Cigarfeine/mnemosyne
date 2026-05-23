"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { recallAPI, memoryAPI } from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, RotateCcw, Brain, Target, Zap, BookOpenCheck, Keyboard } from "lucide-react";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import ShinyText from "@/components/reactbits/ShinyText";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type QuestionState = "question" | "revealed" | "rated";

function StudyPageContent() {
  const params = useParams();
  const docId = params.id as string;
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") || "";
  const [studyMode, setStudyMode] = useState<string>(initialMode);

  const [session, setSession] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [state, setState] = useState<QuestionState>("question");
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (studyMode) loadSession();
  }, [studyMode]);

  const loadSession = async () => {
    setLoading(true);
    setDone(false);
    setSession(null);
    setCurrentIndex(0);
    setQuestionIndex(0);
    setSessionScore({ correct: 0, total: 0 });
    try {
      const res = await recallAPI.getStudySession(docId, studyMode);
      if (!res.data.session_items.length) {
        setDone(true);
      } else {
        setSession(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentItem = session?.session_items[currentIndex];
  const currentQuestion = currentItem?.questions[questionIndex];

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (state === "question") {
        if (e.code === "Space" && currentQuestion?.question_type !== "mcq") {
          e.preventDefault();
          handleReveal();
        }
        if (currentQuestion?.question_type === "mcq" && currentQuestion?.options) {
          const num = parseInt(e.key);
          if (num >= 1 && num <= currentQuestion.options.length) {
            handleMCQAnswer(currentQuestion.options[num - 1]);
          }
        }
      }
      if (state === "revealed") {
        const ratingMap: Record<string, number> = { "1": 0, "2": 2, "3": 4, "4": 5 };
        if (ratingMap[e.key] !== undefined) {
          handleRate(ratingMap[e.key]);
        }
      }
      if (e.key === "Escape") {
        window.history.back();
      }
      if (e.key === "?") {
        setShowShortcuts(s => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, currentQuestion]);

  const handleReveal = () => setState("revealed");

  const handleMCQAnswer = (option: string) => {
    setSelectedAnswer(option);
    const correct = option === currentQuestion.correct_answer;
    setIsCorrect(correct);
    setState("revealed");
  };

  const handleRate = async (quality: number) => {
    setState("rated");
    setSessionScore((s) => ({
      correct: s.correct + (quality >= 3 ? 1 : 0),
      total: s.total + 1
    }));

    try {
      await memoryAPI.submitReview(currentItem.concept_id, quality);
    } catch (e) {
      console.error(e);
    }

    setTimeout(advance, 600);
  };

  const advance = () => {
    const item = session.session_items[currentIndex];
    if (questionIndex + 1 < item.questions.length) {
      setQuestionIndex((i) => i + 1);
    } else if (currentIndex + 1 < session.session_items.length) {
      setCurrentIndex((i) => i + 1);
      setQuestionIndex(0);
    } else {
      setDone(true);
    }
    setState("question");
    setSelectedAnswer("");
    setIsCorrect(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Preparing your {studyMode === "pyq" ? "exam-style" : "study"} session...</p>
        </div>
      </div>
    );
  }

  // Study mode selection screen
  if (!studyMode) {
    return (
      <div className="max-w-2xl mx-auto z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 mt-12"
        >
          <h1 className="text-6xl md:text-7xl font-sans font-black text-[#1a1a1a] tracking-tighter mb-4 leading-[0.95]">
            Choose <span className="font-serif italic font-medium pr-2">Study</span> Mode.
          </h1>
          <p className="text-slate-600 font-medium text-lg">Select how you want to study this material</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setStudyMode("notes")}
            className="bg-white/60 backdrop-blur-md rounded-[32px] p-10 text-left border border-slate-200/60 shadow-soft hover:bg-white/80 transition-colors transition-shadow group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-[20px] bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
              <BookOpenCheck className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-4xl font-serif italic text-[#1a1a1a] pr-2 mb-3">Notes Mode</h3>
            <p className="text-slate-500 leading-relaxed font-medium">
              Deep conceptual understanding. Questions test definitions, relationships, prerequisites, and reasoning.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Definitions", "Conceptual", "Reasoning"].map(tag => (
                <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20">{tag}</span>
              ))}
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setStudyMode("pyq")}
            className="bg-white/60 backdrop-blur-md rounded-[32px] p-10 text-left border border-slate-200/60 shadow-soft hover:bg-white/80 transition-colors transition-shadow group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-[20px] bg-amber-50 flex items-center justify-center mb-6 border border-amber-200 group-hover:bg-amber-100 transition-colors">
              <Target className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-4xl font-serif italic text-[#1a1a1a] pr-2 mb-3">PYQ Analysis</h3>
            <p className="text-slate-500 leading-relaxed font-medium">
              Exam-focused preparation. Questions match previous year patterns, common tricks, and scoring strategies.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Exam Style", "Tricks", "Patterns"].map(tag => (
                <span key={tag} className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-200">{tag}</span>
              ))}
            </div>
          </motion.button>
        </div>
        <div className="mt-8 text-center">
          <Link href={`/document/${docId}`} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            ← Back to document
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    const accuracy = sessionScore.total > 0 ? Math.round((sessionScore.correct / sessionScore.total) * 100) : 0;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto bg-white/60 backdrop-blur-md shadow-soft rounded-[32px] p-12 text-center relative overflow-hidden border border-slate-200/60"
      >
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-5xl font-serif italic text-[#1a1a1a] pr-2 mb-4 tracking-tight">Session Complete!</h2>
        <p className="text-slate-500 mb-8 flex flex-col gap-1">
          <span className="text-lg font-bold text-slate-800">{sessionScore.correct} / {sessionScore.total} correct</span>
          <span>{accuracy}% accuracy rate</span>
          <span className={`text-xs font-bold uppercase mt-2 ${studyMode === "pyq" ? "text-amber-500" : "text-primary"}`}>
            {studyMode === "pyq" ? "PYQ Analysis Mode" : "Notes Study Mode"}
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/document/${docId}`} className="w-full sm:w-auto px-8 py-3 rounded-full text-sm font-bold bg-white text-slate-900 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm flex items-center justify-center">
            Back to document
          </Link>
          <button 
            onClick={() => { setDone(false); setCurrentIndex(0); setQuestionIndex(0); setSessionScore({ correct: 0, total: 0 }); loadSession(); }}
            className="w-full sm:w-auto px-8 py-3 rounded-full text-sm font-bold bg-[#f8a8b8] hover:bg-[#f292a5] text-slate-900 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Review again
          </button>
        </div>
      </motion.div>
    );
  }

  if (!session || !currentItem || !currentQuestion) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto bg-white/60 backdrop-blur-md shadow-soft rounded-[32px] p-12 text-center border border-slate-200/60"
      >
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-200">
          <Target className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-4xl font-serif italic text-[#1a1a1a] pr-2 mb-4">Nothing due for review</h2>
        <p className="text-slate-600 font-medium mb-10">All concepts are scheduled for later. Come back when your memory starts fading to optimize retention.</p>
        <Link href={`/document/${docId}`} className="inline-block px-8 py-3 rounded-full text-sm font-bold bg-[#1a1a1a] hover:bg-[#2a2a2a] shadow-soft text-white transition-all">
          Back to document
        </Link>
      </motion.div>
    );
  }

  const totalCards = session.session_items.reduce((a: number, i: any) => a + i.questions.length, 0);
  const completedCards = session.session_items.slice(0, currentIndex).reduce((a: number, i: any) => a + i.questions.length, 0) + questionIndex;
  const progressPercent = (completedCards / totalCards) * 100;

  return (
    <div className="max-w-2xl mx-auto z-10 relative">
      {/* Keyboard Shortcuts Panel */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-72 glass rounded-2xl p-5 border border-white/10 shadow-2xl z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2"><Keyboard className="w-4 h-4 text-indigo-400" /> Shortcuts</h4>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-white text-xs">×</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300"><span>Reveal answer</span><kbd className="bg-slate-800 px-2 py-0.5 rounded border border-white/10 font-mono">Space</kbd></div>
              <div className="flex justify-between text-slate-300"><span>MCQ options</span><kbd className="bg-slate-800 px-2 py-0.5 rounded border border-white/10 font-mono">1-4</kbd></div>
              <div className="border-t border-white/5 pt-2 mt-2"></div>
              <div className="flex justify-between text-rose-300"><span>Forgot</span><kbd className="bg-slate-800 px-2 py-0.5 rounded border border-white/10 font-mono">1</kbd></div>
              <div className="flex justify-between text-amber-300"><span>Hard</span><kbd className="bg-slate-800 px-2 py-0.5 rounded border border-white/10 font-mono">2</kbd></div>
              <div className="flex justify-between text-blue-300"><span>Good</span><kbd className="bg-slate-800 px-2 py-0.5 rounded border border-white/10 font-mono">3</kbd></div>
              <div className="flex justify-between text-emerald-300"><span>Easy</span><kbd className="bg-slate-800 px-2 py-0.5 rounded border border-white/10 font-mono">4</kbd></div>
              <div className="border-t border-white/5 pt-2 mt-2"></div>
              <div className="flex justify-between text-slate-300"><span>Toggle shortcuts</span><kbd className="bg-slate-800 px-2 py-0.5 rounded border border-white/10 font-mono">?</kbd></div>
              <div className="flex justify-between text-slate-300"><span>Exit</span><kbd className="bg-slate-800 px-2 py-0.5 rounded border border-white/10 font-mono">Esc</kbd></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcut hint button */}
      <button
        onClick={() => setShowShortcuts(s => !s)}
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg"
        title="Keyboard shortcuts (?)"
        style={{ display: showShortcuts ? 'none' : 'flex' }}
      >
        <Keyboard className="w-4 h-4" />
      </button>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 bg-white/60 backdrop-blur-md shadow-soft rounded-[32px] px-8 py-5 border border-slate-200/60"
      >
        <Link href={`/document/${docId}`} className="text-sm font-bold text-slate-900 hover:text-[#1a1a1a] transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Exit
        </Link>
        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
          studyMode === "pyq" 
            ? "bg-amber-50 text-amber-600 border-amber-200" 
            : "bg-primary/10 text-primary border-primary/20"
        }`}>
          {studyMode === "pyq" ? "PYQ Mode" : "Notes Mode"}
        </span>
        <div className="flex-1 mx-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Progress</span>
            <span>{completedCards} of {totalCards}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className={`h-full rounded-full ${studyMode === "pyq" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}-${questionIndex}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4 ml-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
              <ShinyText text={currentItem.concept_name} disabled={false} speed={2} color="#6366f1" shineColor="#8b5cf6" className="inline-block" />
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-10 mb-8 min-h-[300px] flex flex-col border border-slate-200/60 shadow-soft">
            <div className="text-4xl font-serif text-[#1a1a1a] leading-tight mb-10 prose prose-slate max-w-none prose-p:my-0 prose-p:inline-block">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {currentQuestion.question}
              </ReactMarkdown>
            </div>

            <div className="flex-1 flex flex-col justify-end relative z-10">
              {currentQuestion.question_type === "mcq" && state === "question" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {currentQuestion.options?.map((opt: string, i: number) => (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={opt} 
                      onClick={() => handleMCQAnswer(opt)}
                      className="text-base bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm rounded-full px-6 py-5 text-left text-slate-800 hover:text-[#1a1a1a] transition-colors transition-shadow flex items-center gap-4 font-medium"
                    >
                      <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">{i + 1}</span>
                      <div className="prose prose-slate max-w-none prose-p:my-0 prose-p:inline-block">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {opt}
                        </ReactMarkdown>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.question_type !== "mcq" && state === "question" && (
                <button onClick={handleReveal}
                  className="mt-8 text-sm bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-full px-8 py-4 self-center shadow-soft transition-all font-bold flex items-center gap-2">
                  Reveal Answer
                  <Zap className="w-4 h-4" />
                </button>
              )}

              {state !== "question" && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-4 p-5 rounded-2xl text-sm border ${isCorrect === false ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
                >
                  <p className="font-bold mb-2 flex items-center gap-2 text-base">
                    {isCorrect === false ? (
                      <><span className="w-2 h-2 rounded-full bg-rose-500" /> Incorrect</>
                    ) : (
                      <><span className="w-2 h-2 rounded-full bg-emerald-500" /> Correct Answer</>
                    )}
                  </p>
                  <div className="text-slate-900 text-base mb-3 bg-white p-3 rounded-lg border border-slate-200 font-medium prose prose-slate max-w-none prose-p:my-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {currentQuestion.correct_answer}
                    </ReactMarkdown>
                  </div>
                  {currentQuestion.explanation && (
                    <div className="mt-3 text-sm opacity-90 leading-relaxed border-t border-slate-200 pt-3 text-slate-700 prose prose-sm prose-slate max-w-none prose-p:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {currentQuestion.explanation}
                      </ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {(state === "revealed" || state === "rated") && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-md rounded-[32px] p-8 border border-slate-200/60 shadow-soft"
              >
                <p className="text-sm text-[#1a1a1a] text-center font-bold mb-6">How well did you know this?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { quality: 0, label: "Forgot", color: "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200" },
                    { quality: 2, label: "Hard", color: "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200" },
                    { quality: 4, label: "Good", color: "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200" },
                    { quality: 5, label: "Easy", color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200" },
                  ].map(({ quality, label, color }) => (
                    <button key={quality} onClick={() => handleRate(quality)}
                      disabled={state === "rated"}
                      className={`border rounded-full py-4 text-sm font-bold transition-all shadow-sm ${color} disabled:opacity-50 disabled:cursor-not-allowed`}>
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    }>
      <StudyPageContent />
    </Suspense>
  );
}
