import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Eye, GitCompare } from "lucide-react";
import { checkDuplicate, getAnalytics } from "@/lib/api";

export function DuplicateChecker() {
  const [result, setResult] = useState<any | null>(null);
  const [featuredProduct, setFeaturedProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDuplicateCheck = async () => {
      setLoading(true);
      setError(null);
      try {
        const analytics = await getAnalytics();
        const product = analytics.featuredProduct;
        setFeaturedProduct(product);
        if (product) {
          const data = await checkDuplicate({
            name: product.name,
            category: product.category,
            color: product.color,
            brand: product.brand,
            imageUrl: product.imageUrl,
          });
          setResult(data);
        } else {
          setResult(null);
        }
      } catch (err: any) {
        setError(err?.message || 'Unable to verify duplicate purchase.');
      } finally {
        setLoading(false);
      }
    };

    loadDuplicateCheck();
  }, []);

  const topMatch = result?.topMatch;
  const duplicateRisk = result?.isDuplicate ? 'High' : 'Low';
  const decision = result?.isDuplicate ? 'Reconsider' : 'Safe to buy';
  const alternative = topMatch?.name || 'No close duplicate found';
  const saveAmount = result?.isDuplicate ? `₹${Math.round((featuredProduct.price || 0) * 0.2)}` : '₹0';

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-6">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
        className="rounded-3xl border-2 border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold text-amber-700 tracking-widest">
              {result?.isDuplicate ? 'DUPLICATE PURCHASE DETECTED' : 'DUPLICATE PURCHASE CHECK'}
            </div>
            <h3 className="text-xl font-bold text-myntra-dark mt-1">
              {result?.isDuplicate ? 'You already own similar items' : 'No strong duplicate was found'}
            </h3>
            {loading ? (
              <div className="mt-4 text-sm text-muted-foreground">Checking this product against your wardrobe…</div>
            ) : error ? (
              <div className="mt-4 text-sm text-red-700">{error}</div>
            ) : topMatch ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {[topMatch].map((d) => (
                  <div key={d.name} className="rounded-xl bg-white/70 backdrop-blur p-3 border border-amber-200/50">
                    <div className="text-sm font-semibold text-myntra-dark">{d.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">Similarity: <b className="text-amber-700">{d.similarity}%</b></div>
                    <div className="text-xs text-muted-foreground mt-1">{d.reason}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-3xl border border-border bg-white/80 p-4 text-sm text-muted-foreground">
                {result?.message || 'No close duplicate items were found in your wardrobe.'}
              </div>
            )}
            {!loading && !error && !featuredProduct ? (
              <div className="mt-4 rounded-3xl border border-border bg-white/80 p-4 text-sm text-muted-foreground">
                Loading featured product for duplicate detection...
              </div>
            ) : null}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Metric label="Duplicate Risk" value={duplicateRisk} tone={result?.isDuplicate ? 'warn' : 'ok'} />
              <Metric label="Should Buy?" value={decision} tone={result?.isDuplicate ? 'warn' : 'ok'} />
              <Metric label="Most Similar" value={alternative} tone={result?.isDuplicate ? 'warn' : 'ok'} />
              <Metric label="Save" value={saveAmount} tone={result?.isDuplicate ? 'ok' : 'ok'} />
            </div>
            <div className="flex gap-2 mt-5">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-myntra-dark text-white text-xs font-bold hover:bg-primary transition-colors">
                <Eye className="w-3.5 h-3.5" /> View Existing Item
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border text-xs font-bold text-myntra-dark hover:border-primary transition-colors">
                <GitCompare className="w-3.5 h-3.5" /> Compare
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
function Metric({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" }) {
  return (
    <div className="rounded-xl bg-white/70 backdrop-blur p-3 border border-amber-200/50">
      <div className="text-[10px] font-bold text-muted-foreground uppercase">{label}</div>
      <div className={`text-sm font-bold mt-0.5 ${tone === "warn" ? "text-amber-700" : "text-emerald-700"}`}>{value}</div>
    </div>
  );
}
