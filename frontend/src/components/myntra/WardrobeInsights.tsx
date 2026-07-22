import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAnalytics } from "@/lib/api";
import { SectionHeader } from "./DigitalCloset";

export function WardrobeInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const analytics = await getAnalytics();
        setInsights(analytics.insights || []);
      } catch {
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);
  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-12">
      <SectionHeader badge="ANALYTICS" title="Wardrobe Insights" subtitle="Understand your style. Wear more, waste less." />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
        {(loading ? Array.from({ length: 6 }, (_, i) => ({ label: 'Loading', value: '-', sub: '' })) : insights).map((it, i) => (
          <motion.div key={it.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} viewport={{ once: true }} whileHover={{ y: -4 }}
            className="rounded-2xl p-5 bg-card border border-border hover:shadow-[var(--shadow-myntra)] hover:border-primary/30 transition-all">
            <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{it.label}</div>
            <div className="text-2xl font-black text-myntra-dark mt-2">{it.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{it.sub}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
