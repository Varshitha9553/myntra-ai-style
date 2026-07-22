import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot } from "lucide-react";

const quickPrompts = [
  "What should I wear today?",
  "What matches my blue jeans?",
  "Do I already own this?",
  "Create a vacation outfit",
  "Suggest interview outfit",
];

type Msg = { role: "user" | "ai"; text: string };

const canned: Record<string, string> = {
  default: "I can style outfits from your closet, warn you about duplicates, and suggest missing essentials. What would you like to explore?",
  wear: "Based on today's sunny weather and your calendar, I'd pair your white cotton shirt with beige trousers and brown loafers. AI match: 96%.",
  jeans: "Your blue jeans go beautifully with the floral blouse (92%), white sneakers, and the leather belt you already own.",
  own: "Yes — you own 2 similar black hoodies. Consider skipping this purchase to save ₹1,499.",
  vacation: "Vacation capsule ready: 3 breathable tops, 2 shorts, sneakers, and a floral dress. Want me to build the outfits?",
  interview: "For a strong interview look: black blazer + white shirt + charcoal chinos + brown loafers. Confident and classic.",
};

function reply(q: string) {
  const l = q.toLowerCase();
  if (l.includes("wear today")) return canned.wear;
  if (l.includes("jean")) return canned.jeans;
  if (l.includes("own")) return canned.own;
  if (l.includes("vacation")) return canned.vacation;
  if (l.includes("interview")) return canned.interview;
  return canned.default;
}

export function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi! I'm your AI stylist ✨ Ask me anything about your wardrobe." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTimeout(() => setMessages((m) => [...m, { role: "ai", text: reply(text) }]), 500);
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
        style={{ background: "linear-gradient(135deg, oklch(0.68 0.24 12), oklch(0.55 0.28 300))" }}
        aria-label="Open AI Stylist"
      >
        <Sparkles className="w-7 h-7" />
        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "oklch(0.68 0.24 12 / 0.3)" }} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[560px] rounded-3xl bg-card border border-border shadow-[var(--shadow-elevated)] flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, oklch(0.68 0.24 12), oklch(0.55 0.28 300))" }}>
              <div className="flex items-center gap-2 text-white">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Myntra AI Stylist</div>
                  <div className="text-[11px] opacity-80">Online · Powered by AI</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/30">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-white text-myntra-dark border border-border rounded-bl-sm"
                  }`}>{m.text}</div>
                </motion.div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-border bg-card">
              <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                {quickPrompts.map((q) => (
                  <button key={q} onClick={() => send(q)}
                    className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-secondary text-myntra-dark hover:bg-primary/10 hover:text-primary transition-colors">
                    {q}
                  </button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 mt-1">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything…"
                  className="flex-1 px-4 py-2.5 rounded-full bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="submit" className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform" aria-label="Send">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
