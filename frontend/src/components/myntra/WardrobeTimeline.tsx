import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Shirt, ShoppingBag, Wand2 } from "lucide-react";
import { getAnalytics } from "@/lib/api";
import { SectionHeader } from "./DigitalCloset";

const typeMeta = {
  scan: { icon: Camera, tone: "bg-blue-500/10 text-blue-600" },
  wear: { icon: Shirt, tone: "bg-emerald-500/10 text-emerald-600" },
  buy: { icon: ShoppingBag, tone: "bg-primary/10 text-primary" },
  style: { icon: Wand2, tone: "bg-purple-500/10 text-purple-600" },
} as const;

export function WardrobeTimeline() {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const analytics = await getAnalytics();
        setTimeline(analytics.timeline || []);
      } catch {
        setTimeline([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);
  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-12">
      <SectionHeader badge="ACTIVITY" title="Wardrobe Timeline" subtitle="Everything you scanned, wore, purchased, and styled." />
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(loading ? Array.from({ length: 4 }, (_, index) => ({ type: 'scan', title: 'Loading...', time: 'Today', img: '' })) : timeline).map((t, i) => {
          const m = typeMeta[t.type as keyof typeof typeMeta];
          const Icon = m.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }} viewport={{ once: true }}
              className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:shadow-[var(--shadow-myntra)] hover:border-primary/30 transition-all">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                <img src={t.img} alt={t.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${m.tone}`}>
                  <Icon className="w-3 h-3" /> {t.type}
                </div>
                <h4 className="text-sm font-semibold text-myntra-dark truncate mt-1">{t.title}</h4>
                <p className="text-xs text-muted-foreground">{t.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
