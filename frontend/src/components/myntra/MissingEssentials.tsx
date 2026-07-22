import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { getAnalytics } from "@/lib/api";
import { SectionHeader } from "./DigitalCloset";

export function MissingEssentials() {
  const [essentials, setEssentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const analytics = await getAnalytics();
        setEssentials(analytics.missingEssentials || []);
      } catch {
        setEssentials([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);
  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-12">
      <SectionHeader badge="WARDROBE GAPS" title="Complete Your Wardrobe" subtitle="AI-identified basics that will multiply your outfit combinations." />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
        {(loading ? Array.from({ length: 5 }, (_, index) => ({ id: `loading-${index}`, name: 'Loading', reason: '', imageUrl: '' })) : essentials).map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} viewport={{ once: true }} whileHover={{ y: -6 }}
            className="group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-[var(--shadow-elevated)] hover:border-primary/40 transition-all cursor-pointer">
            <div className="relative aspect-square overflow-hidden bg-secondary">
              <img src={e.imageUrl} alt={e.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-2 left-2 text-[10px] font-bold text-white bg-primary px-2 py-1 rounded">ESSENTIAL</div>
              <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3">
              <h4 className="text-sm font-bold text-myntra-dark">{e.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.reason}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
