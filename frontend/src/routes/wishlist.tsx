import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/myntra/Header";
import { Footer } from "@/components/myntra/Footer";
import { getWishlist, removeFromWishlist } from "@/lib/api";
import { motion } from "framer-motion";
import { Heart, Trash2, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/myntra/DigitalCloset";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist · Myntra AI Closet" },
      { name: "description", content: "View and shop your curated wishlist selections." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("myntra_token");
    if (!token) {
      navigate({ to: "/login" });
      return;
    }

    const fetchWishlist = async () => {
      try {
        const data = await getWishlist();
        setItems(data || []);
      } catch (err: any) {
        setError("Failed to load wishlist.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  const handleRemove = async (id: number) => {
    try {
      await removeFromWishlist(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Failed to remove item.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 mx-auto max-w-[1400px] px-4 md:px-8">
        <SectionHeader badge="CURATED PICKS" title="My Wishlist" subtitle="Your favorite AI recommended products ready for matching." />

        {loading ? (
          <div className="mt-8 rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground animate-pulse">
            Loading your favorites...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">{error}</div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              {items.map((item) => (
                <motion.div key={item.id} whileHover={{ y: -4 }} className="group rounded-3xl overflow-hidden bg-card border border-border hover:shadow-[var(--shadow-elevated)] transition-all flex flex-col justify-between">
                  <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No Image</div>
                    )}
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 hover:scale-110 shadow transition-transform"
                    >
                      <Heart className="w-4 h-4 fill-current text-red-600" />
                    </button>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{item.brand || 'Myntra Pick'}</span>
                      <h4 className="text-sm font-bold text-myntra-dark line-clamp-1">{item.productName}</h4>
                      <div className="text-sm font-black text-myntra-dark">₹{item.price || 999}</div>
                    </div>
                    <a 
                      href={item.myntraUrl || `https://www.myntra.com/${encodeURIComponent(item.productName)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full text-center py-2 rounded-lg bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-colors inline-block"
                    >
                      View on Myntra <ExternalLink className="w-3.5 h-3.5 inline ml-1 align-text-top" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="rounded-3xl border border-border p-12 text-center text-sm text-muted-foreground bg-card mt-8">
                Your wishlist is empty. Tap the Heart icon on recommended products to save them here!
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
