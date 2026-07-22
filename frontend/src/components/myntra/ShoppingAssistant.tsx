import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, ExternalLink, ShoppingBag } from "lucide-react";
import { analyzeShoppingAssistant, addToWishlist, getAnalytics } from "@/lib/api";
import { SectionHeader } from "./DigitalCloset";

const demoProducts = [
  {
    name: "Classic White Oxford Shirt",
    category: "Topwear",
    color: "White",
    price: 2499,
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
    reason: "A versatile staple for your wardrobe."
  },
  {
    name: "Black Crew Neck T-Shirt",
    category: "Topwear",
    color: "Black",
    price: 999,
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
    reason: "Standard essential everyday wear."
  },
  {
    name: "Classic Beige Chinos",
    category: "Bottomwear",
    color: "Beige",
    price: 1999,
    imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80",
    reason: "Casual beige trousers."
  },
  {
    name: "Sporty Yellow Track Pants",
    category: "Bottomwear",
    color: "Yellow",
    price: 1799,
    imageUrl: "https://images.unsplash.com/photo-1551854838-212c50b4c184?w=600&q=80",
    reason: "Bright athletic leisurewear."
  }
];

const parseMyntraUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes("myntra.com")) {
      return null;
    }
    
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    if (pathParts.length === 0) return null;

    let slug = "";
    for (const part of pathParts) {
      if (part.includes("-") && !/^\d+$/.test(part)) {
        slug = part;
        break;
      }
    }

    if (!slug) {
      slug = pathParts[0];
    }

    const name = slug
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    let category = "Topwear";
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("pant") || lowerUrl.includes("trousers") || lowerUrl.includes("jeans") || lowerUrl.includes("shorts") || lowerUrl.includes("skirt")) {
      category = "Bottomwear";
    } else if (lowerUrl.includes("shoe") || lowerUrl.includes("sneakers") || lowerUrl.includes("footwear") || lowerUrl.includes("sandals") || lowerUrl.includes("clog") || lowerUrl.includes("slider") || lowerUrl.includes("flip-flop")) {
      category = "Accessories";
    } else if (lowerUrl.includes("jacket") || lowerUrl.includes("coat") || lowerUrl.includes("sweater") || lowerUrl.includes("shrug")) {
      category = "Outerwear";
    } else if (lowerUrl.includes("dress") || lowerUrl.includes("saree") || lowerUrl.includes("kurta")) {
      category = "Dress";
    } else if (lowerUrl.includes("watch") || lowerUrl.includes("belt") || lowerUrl.includes("bag") || lowerUrl.includes("sunglasses")) {
      category = "Accessories";
    }

    const imageUrl = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80";
    
    let matchedImage = imageUrl;
    if (category === "Topwear") {
      matchedImage = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80";
      if (lowerUrl.includes("black")) {
        matchedImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80";
      }
    } else if (category === "Bottomwear") {
      matchedImage = "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80";
    } else if (category === "Footwear") {
      matchedImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80";
    } else if (category === "Outerwear") {
      matchedImage = "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80";
    }

    return {
      name,
      category,
      price: Math.floor(Math.random() * 1500) + 999,
      imageUrl: matchedImage,
      reason: "Custom parsed product from Myntra URL."
    };
  } catch (e) {
    return null;
  }
};

export function ShoppingAssistant() {
  const [product, setProduct] = useState<any | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlistSaved, setWishlistSaved] = useState(false);
  
  const [urlInput, setUrlInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const getMyntraUrl = (name: string) => {
    return `https://www.myntra.com/${encodeURIComponent(name)}`;
  };

  const getRecommendationLabel = (score: number) => {
    if (score >= 85) return "Highly Recommended";
    if (score >= 60) return "Good Addition";
    return "Not Recommended";
  };

  const getRecommendationColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 bg-emerald-50 border border-emerald-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border border-blue-200";
    return "text-rose-600 bg-rose-50 border border-rose-200";
  };

  const loadAnalysis = async (selected?: any, myntraUrl?: string) => {
    setLoading(true);
    setError(null);
    setWishlistSaved(false);
    
    // Set immediate loading preview product details if searching a URL
    if (myntraUrl) {
      const parsed = parseMyntraUrl(myntraUrl);
      if (parsed) {
        setProduct(parsed);
      } else {
        setProduct({ name: "Fetching Myntra Product...", category: "Accessories", price: 0, imageUrl: "" });
      }
    }

    try {
      let activeProduct = selected;
      if (!activeProduct && !myntraUrl) {
        const analytics = await getAnalytics();
        const featured = analytics.featuredProduct;
        activeProduct = featured || demoProducts[0];
      }
      if (activeProduct) {
        setProduct(activeProduct);
      }
      
      const response = await analyzeShoppingAssistant(undefined, activeProduct, myntraUrl);
      setAnalysis(response);
      if (response.product) {
        setProduct(response.product);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to analyze this product against your wardrobe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  const handleSelectProduct = (p: any) => {
    loadAnalysis(p);
  };

  const handleUrlAnalyze = () => {
    if (!urlInput.trim()) {
      setUrlError("Please paste a valid Myntra URL first.");
      return;
    }
    if (!urlInput.toLowerCase().includes("myntra.com")) {
      setUrlError("Invalid Myntra URL. Please make sure the URL contains myntra.com.");
      return;
    }
    loadAnalysis(undefined, urlInput.trim());
  };

  const handleSaveWishlist = async () => {
    if (!product) return;
    try {
      await addToWishlist({
        productName: product.name,
        productImage: product.imageUrl,
        brand: product.brand || product.category || 'Myntra Pick',
        price: product.price,
        myntraUrl: getMyntraUrl(product.name)
      });
      setWishlistSaved(true);
      alert(`"${product.name}" added to Wishlist!`);
    } catch (err) {
      alert("Failed to add to wishlist.");
    }
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 border-t border-border mt-12">
      <SectionHeader badge="SMART SHOPPING" title="Before You Buy…" subtitle="AI insights to help you shop smarter, not more." />
      
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mt-8 rounded-3xl bg-gradient-to-br from-primary/5 via-card to-purple-500/5 border border-primary/20 p-6 md:p-8 shadow-[var(--shadow-myntra)]">
        
        {/* URL Input Analysis Form */}
        <div className="mb-8 space-y-3 bg-white p-6 rounded-3xl border border-border shadow-sm">
          <h4 className="text-xs font-bold text-myntra-dark uppercase tracking-wider">Paste a Myntra Product Link:</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://www.myntra.com/casual-shoes/bersache/bersache-boys-printed-canvas-lace-ups-sneakers/30452873/buy"
              className="flex-1 px-4 py-3 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              onClick={handleUrlAnalyze}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap disabled:opacity-75"
            >
              {loading ? "Fetching & Analyzing..." : "Analyze Product URL"}
            </button>
          </div>
          {urlError && (
            <p className="text-[10px] text-red-600 font-semibold">{urlError}</p>
          )}
        </div>

        {/* Product Selection Panel */}
        <div className="mb-8 space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select a Product to Analyze:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {demoProducts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectProduct(p)}
                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all hover:bg-primary/5 ${
                  product?.name === p.name ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white"
                }`}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-myntra-dark truncate">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">₹{p.price} · {p.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-border/50">
          <div className="lg:col-span-1">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-secondary shadow-sm relative group">
              <img src={product?.imageUrl} alt={product?.name || 'Featured product'} className="w-full h-full object-cover" />
              <button 
                onClick={handleSaveWishlist}
                disabled={wishlistSaved}
                className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-115 ${
                  wishlistSaved ? "bg-red-500 text-white" : "bg-white text-myntra-dark hover:text-red-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${wishlistSaved ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> AI ANALYSIS
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black text-myntra-dark">{product?.name || 'Featured Product'}</h3>
              <div className="text-sm text-muted-foreground">Compare this Myntra product against your existing wardrobe and get a purchase recommendation.</div>
              <div className="flex items-center justify-between rounded-3xl bg-white border border-border p-4 shadow-sm max-w-sm">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Price</div>
                  <div className="text-lg font-bold text-myntra-dark">₹{product?.price || '--'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Category</div>
                  <div className="text-xs font-bold text-myntra-dark mt-0.5">{product?.category || '--'}</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground animate-pulse">
                Analyzing product against your wardrobe...
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
                <button
                  onClick={() => loadAnalysis(product)}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition shadow-sm"
                >
                  Retry Analysis
                </button>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                
                {/* Smart Shopping Assistant Card */}
                <div className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Smart Shopping Assistant</h4>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getRecommendationColor(analysis.compatibility.compatibilityScore)}`}>
                        {getRecommendationLabel(analysis.compatibility.compatibilityScore)}
                      </div>
                      <div className="text-sm font-bold text-myntra-dark">
                        Compatibility Score: {analysis.compatibility.compatibilityScore}%
                      </div>
                      
                      {analysis.duplicate && analysis.duplicate.similarity >= 40 && (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          analysis.duplicate.similarity >= 90 ? "bg-rose-100 text-rose-700" :
                          analysis.duplicate.similarity >= 70 ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {analysis.duplicate.status} ({analysis.duplicate.similarity}%)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-secondary/50 p-4 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Confidence</div>
                      <div className="text-sm font-black text-myntra-dark mt-2.5">{analysis.compatibility.confidence || 85}%</div>
                    </div>
                    <div className="rounded-2xl bg-secondary/50 p-4 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Duplicate Risk</div>
                      <div className="text-xs font-bold text-myntra-dark mt-2.5">
                        {analysis.duplicate.similarity >= 90 ? "🚨 Duplicate (Avoid)" :
                         analysis.duplicate.similarity >= 70 ? "⚠️ High Risk" :
                         analysis.duplicate.similarity >= 40 ? "ℹ️ Moderate" : "✅ Unique Addition"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-secondary/50 p-4 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Wardrobe Gap</div>
                      <div className="text-xs font-bold text-myntra-dark mt-2.5 truncate" title={analysis.compatibility.wardrobeGap}>
                        {analysis.compatibility.wardrobeGap || 'None'}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-secondary/50 p-4 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Outfit Potential</div>
                      <div className="text-xs font-bold text-myntra-dark mt-2.5">
                        {analysis.compatibility.outfitPotential || 'No major impact'}
                      </div>
                    </div>
                  </div>

                  {/* Wardrobe Visual Comparison Section (Nested inside the card) */}
                  {analysis.duplicate && analysis.duplicate.topMatch && analysis.duplicate.similarity >= 40 && (
                    <div className="rounded-2xl border border-border bg-secondary/20 p-4 space-y-3">
                      <div className="text-[10px] font-black text-myntra-dark uppercase tracking-wider opacity-75">Wardrobe Visual Comparison</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Selected Product */}
                        <div className="bg-white border border-border p-3 rounded-xl flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">NEW</span>
                            <div className="text-xs font-bold text-myntra-dark truncate mt-1">{product.name}</div>
                          </div>
                        </div>

                        {/* Existing Item */}
                        <div className="bg-white border border-border p-3 rounded-xl flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                            <img src={analysis.duplicate.topMatch.imageUrl} alt={analysis.duplicate.topMatch.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">IN CLOSET ({analysis.duplicate.similarity}%)</span>
                            <div className="text-xs font-bold text-myntra-dark truncate mt-1">{analysis.duplicate.topMatch.name}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-relaxed">
                        <strong>AI Note:</strong> {analysis.duplicate.reason}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">AI Explanation</div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{analysis.compatibility.reason}</p>
                  </div>

                  {/* Buy / View Triggers */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
                    {(!analysis.duplicate || analysis.duplicate.similarity < 90) && (
                      <a
                        href={getMyntraUrl(product.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#ff3f6c] hover:bg-[#ff3f6c]/90 text-white text-xs font-bold transition-all shadow-md"
                      >
                        <ShoppingBag className="w-4 h-4" /> Buy on Myntra
                      </a>
                    )}
                    <a
                      href={getMyntraUrl(product.name)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-myntra-dark text-xs font-bold transition-all border border-border"
                    >
                      View on Myntra <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={handleSaveWishlist}
                      disabled={wishlistSaved}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white border border-border hover:bg-secondary/40 text-xs font-bold transition-all text-myntra-dark disabled:opacity-55"
                    >
                      <Heart className="w-3.5 h-3.5 text-primary fill-current" /> {wishlistSaved ? "Saved to Wishlist" : "Save to Wishlist"}
                    </button>
                  </div>
                </div>

                {/* Fills Wardrobe Gap Completion message */}
                {analysis.compatibility.wardrobeGap && analysis.compatibility.wardrobeGap !== "None" && !analysis.duplicate.isDuplicate && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <span>✨</span> This product completes your wardrobe.
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-900">
                      This item fits your wardrobe gap in <strong>{analysis.compatibility.wardrobeGap}</strong> and can unlock approximately <strong>{analysis.compatibility.outfitPotential || 'multiple new'} combinations</strong>.
                    </p>
                  </div>
                )}

                {/* Pairs Well With Your Wardrobe */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div>
                    <h4 className="text-sm font-bold text-myntra-dark uppercase tracking-wider">Pairs Well With Your Wardrobe</h4>
                    <p className="text-xs text-muted-foreground">Existing items in your digital closet that coordinate with this piece.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analysis.matchingItems && analysis.matchingItems.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-2xl border border-border bg-white p-3 flex flex-col justify-between space-y-2">
                        <div className="aspect-square rounded-xl overflow-hidden bg-secondary">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-myntra-dark truncate">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground">{item.category} · {item.color}</div>
                        </div>
                      </div>
                    ))}
                    {(!analysis.matchingItems || analysis.matchingItems.length === 0) && (
                      <div className="col-span-full rounded-2xl border border-border bg-secondary/20 p-6 text-center space-y-3">
                        <p className="text-xs text-muted-foreground">No matching coordinate items found in your closet.</p>
                        <a
                          href={`https://www.myntra.com/shop/${encodeURIComponent(product.category || 'clothing')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold transition-all shadow-sm"
                        >
                          Find matching coordinates on Myntra
                        </a>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
