"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { recallAPI, memoryAPI } from "@/lib/api";
import Link from "next/link";

type QuestionState = "question" | "revealed" | "rated";

export default function StudyPage() {
  const params = useParams();
  const docId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [state, setState] = useState<QuestionState>("question");
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const res = await recallAPI.getStudySession(docId);
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

    setTimeout(advance, 400);
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

  if (loading) return <div className="p-8 text-muted-foreground">Loading session...</div>;

  if (done) {
    const accuracy = sessionScore.total > 0 ? Math.round((sessionScore.correct / sessionScore.total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-4xl mb-4">✓</p>
        <h2 className="text-2xl font-semibold mb-2">Session complete</h2>
        <p className="text-muted-foreground mb-6">{sessionScore.correct}/{sessionScore.total} correct · {accuracy}% accuracy</p>
        <div className="flex gap-3 justify-center">
          <Link href={`/document/${docId}`}><button className="border border-border px-5 py-2 rounded-lg text-sm">Back to document</button></Link>
          <button onClick={() => { setDone(false); setCurrentIndex(0); setQuestionIndex(0); loadSession(); }}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm">
            Review again
          </button>
        </div>
      </div>
    );
  }

  if (!session || !currentItem || !currentQuestion) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <h2 className="text-xl font-semibold mb-3">Nothing due for review</h2>
        <p className="text-muted-foreground text-sm mb-6">All concepts are scheduled for later. Come back when they&apos;re due.</p>
        <Link href={`/document/${docId}`}><button className="border border-border px-5 py-2 rounded-lg text-sm">Back to document</button></Link>
      </div>
    );
  }

  const totalCards = session.session_items.reduce((a: number, i: any) => a + i.questions.length, 0);
  const completedCards = session.session_items.slice(0, currentIndex).reduce((a: number, i: any) => a + i.questions.length, 0) + questionIndex;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <Link href={`/document/${docId}`} className="text-sm text-muted-foreground hover:text-foreground">← Exit</Link>
        <div className="flex-1 mx-6">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedCards / totalCards) * 100}%` }} />
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{completedCards}/{totalCards}</span>
      </div>

      <p className="text-xs text-primary font-medium mb-3 uppercase tracking-wider">{currentItem.concept_name}</p>

      <div className="border border-border rounded-2xl p-8 mb-6 min-h-[200px] flex flex-col justify-between">
        <p className="text-lg leading-relaxed">{currentQuestion.question}</p>

        {currentQuestion.question_type === "mcq" && state === "question" && (
          <div className="grid grid-cols-2 gap-2 mt-6">
            {currentQuestion.options?.map((opt: string) => (
              <button key={opt} onClick={() => handleMCQAnswer(opt)}
                className="text-sm border border-border rounded-lg px-4 py-3 text-left hover:bg-secondary transition-colors">
                {opt}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.question_type !== "mcq" && state === "question" && (
          <button onClick={handleReveal}
            className="mt-6 text-sm border border-border rounded-lg px-4 py-2.5 hover:bg-secondary self-start">
            Show answer
          </button>
        )}

        {state === "revealed" && (
          <div className="mt-6">
            <div className={`p-4 rounded-lg text-sm ${isCorrect === false ? "bg-red-50 border border-red-200 text-red-800" : "bg-green-50 border border-green-200 text-green-800"}`}>
              <p className="font-medium mb-1">{isCorrect === false ? "Incorrect" : "Answer"}</p>
              <p>{currentQuestion.correct_answer}</p>
              {currentQuestion.explanation && (
                <p className="mt-2 text-xs opacity-80">{currentQuestion.explanation}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {state === "revealed" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">How well did you know this?</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { quality: 0, label: "Forgot", color: "border-red-200 text-red-700 hover:bg-red-50" },
              { quality: 2, label: "Hard", color: "border-orange-200 text-orange-700 hover:bg-orange-50" },
              { quality: 4, label: "Good", color: "border-blue-200 text-blue-700 hover:bg-blue-50" },
              { quality: 5, label: "Easy", color: "border-green-200 text-green-700 hover:bg-green-50" },
            ].map(({ quality, label, color }) => (
              <button key={quality} onClick={() => handleRate(quality)}
                className={`border rounded-lg py-3 text-sm font-medium transition-colors ${color}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
