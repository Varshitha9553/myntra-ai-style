import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Award } from "lucide-react";
import { getAnalytics } from "@/lib/api";

export function ShoppingImpact() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const analytics = await getAnalytics();
        setStats(analytics.shoppingImpact || []);
      } catch {
        setStats([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);
  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-primary/5 border border-emerald-200/60 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> SHOPPING IMPACT
            </div>
            <h3 className="text-2xl font-black text-myntra-dark mt-2">Smart Purchase Preview</h3>
            <p className="text-sm text-muted-foreground mt-1">Here's how this checkout affects your wardrobe.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500 text-white px-4 py-2 text-sm font-bold shadow-lg">
            <Award className="w-4 h-4" /> Smart Rating: Excellent
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {(loading ? Array.from({ length: 4 }, (_, index) => ({ label: 'Loading', value: '--', tone: 'ok' })) : stats).map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-4 border border-border">
              <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">{s.label}</div>
              <div className={`text-2xl font-black mt-1 ${s.tone === "ok" ? "text-emerald-600" : "text-myntra-dark"}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
