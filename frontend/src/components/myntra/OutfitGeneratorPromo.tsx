import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function OutfitGeneratorPromo() {
  return (
    <section className="bg-gradient-to-b from-secondary/50 to-transparent py-12">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="rounded-3xl border border-border bg-card overflow-hidden hover:shadow-[var(--shadow-elevated)] transition-all p-8 md:p-12 relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Powered by AI
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-myntra-dark tracking-tight">
              AI Outfit Generator
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              Get personalized, handpicked outfit combinations generated directly from your virtual wardrobe. 
              Tailored specifically to your occasion, preferences, and real-time weather conditions.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shrink-0">
            <Link
              to="/outfit-generator"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-bold text-primary-foreground shadow-[var(--shadow-myntra)] hover:bg-primary/90 transition-all"
            >
              Style Me Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
