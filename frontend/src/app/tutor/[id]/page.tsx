"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { tutorAPI } from "@/lib/api";
import Link from "next/link";

export default function TutorPage() {
  const params = useParams();
  const docId = params.id as string;
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await tutorAPI.chat(msg, docId, sessionId);
      setMessages((m) => [...m, { role: "assistant", content: res.data.response }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href={`/document/${docId}`} className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
        <div>
          <p className="font-medium">Mnemosyne Tutor</p>
          <p className="text-xs text-muted-foreground">Context-aware · Knows your weak areas</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            <p className="text-lg mb-2">Ask me anything about your document</p>
            <p>I know your weak concepts and will focus on what you need most.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-secondary text-foreground rounded-bl-sm"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about any concept..."
            className="flex-1 border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-primary text-primary-foreground px-5 rounded-xl text-sm disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
