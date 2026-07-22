import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAnalytics } from "@/lib/api";
import { Sparkles } from "lucide-react";

function Ring({ value, size = 120 }: { value: number; size?: number }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={8} className="stroke-secondary" fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
        stroke="url(#g1)"
        initial={{ strokeDasharray: `0 ${c}` }}
        whileInView={{ strokeDasharray: `${(value / 100) * c} ${c}` }}
        transition={{ duration: 1, ease: "easeOut" }}
        viewport={{ once: true }}
      />
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.68 0.24 12)" />
          <stop offset="1" stopColor="oklch(0.55 0.28 300)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FashionScoreCard() {
  const [score, setScore] = useState({ overall: 0, diversity: 0, versatility: 0, colorBalance: 0, minimalDupes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScore = async () => {
      try {
        const analytics = await getAnalytics();
        setScore(analytics.fashionScore || score);
      } catch {
        setScore(score);
      } finally {
        setLoading(false);
      }
    };
    void loadScore();
  }, []);

  const metrics = [
    { label: "Wardrobe Diversity", value: loading ? 0 : score.diversity },
    { label: "Versatility", value: loading ? 0 : score.versatility },
    { label: "Color Balance", value: loading ? 0 : score.colorBalance },
    { label: "Minimal Duplicates", value: loading ? 0 : score.minimalDupes },
  ];

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl overflow-hidden p-6 md:p-10 relative"
        style={{ background: "linear-gradient(135deg, oklch(0.22 0.03 280) 0%, oklch(0.28 0.05 320) 100%)" }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30 blur-3xl" style={{ background: "oklch(0.68 0.24 12)" }} />
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="flex flex-col items-center lg:items-start">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-widest text-white/80 bg-white/10 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> AI FASHION SCORE
            </span>
            <div className="relative mt-4 flex items-center justify-center">
              <Ring value={loading ? 0 : score.overall} size={200} />
              <div className="absolute text-center">
                <div className="text-5xl font-black text-white">{loading ? '--' : score.overall}</div>
                <div className="text-xs text-white/70">out of 100</div>
              </div>
            </div>
            <p className="text-white/80 text-sm mt-4 text-center lg:text-left">
              You're in the top <b className="text-white">7%</b> of stylish shoppers this month.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-2xl p-5 bg-white/5 backdrop-blur border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/70">{m.label}</span>
                  <span className="text-xl font-black text-white">{m.value}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${m.value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, oklch(0.68 0.24 12), oklch(0.55 0.28 300))" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
