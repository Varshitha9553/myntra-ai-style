import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, CloudRain, Snowflake, Shuffle, ShoppingBag, Check, X, Heart } from "lucide-react";
import { outfitFilters } from "@/data/wardrobe";
import { generateOutfit, reviseOutfit, wearOutfit } from "@/lib/api";
import { SectionHeader } from "./DigitalCloset";
import { useWeather } from "@/hooks/useWeather";

const weatherIcon = { Sunny: Sun, Rainy: CloudRain, Cold: Snowflake };

function getScoreColor(score: number) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-sky-600";
  if (score >= 60) return "text-orange-600";
  return "text-rose-600";
}

function getScoreBg(score: number) {
  if (score >= 90) return "bg-emerald-500/10";
  if (score >= 75) return "bg-sky-500/10";
  if (score >= 60) return "bg-orange-500/10";
  return "bg-rose-500/10";
}

export function OutfitGenerator() {
  const [occ, setOcc] = useState("Office");
  const [weather, setWeather] = useState("Sunny");
  const [outfits, setOutfits] = useState<any[]>([]);
  const [combinations, setCombinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCombinations, setShowCombinations] = useState(false);
  const [revisingIdx, setRevisingIdx] = useState<number | null>(null);
  const [wearingIdx, setWearingIdx] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [likedOutfits, setLikedOutfits] = useState<any[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("myntra_liked_outfits");
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    } catch {
      return [];
    }
  });
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  const { weather: detectedWeather } = useWeather();

  useEffect(() => {
    if (detectedWeather?.current?.condition) {
      setWeather(detectedWeather.current.condition);
    }
  }, [detectedWeather]);



  const handleGenerate = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsGenerating(true);
    try {
      const response = (await generateOutfit(occ, weather)) as any;
      if (response.outfits && Array.isArray(response.outfits)) {
        setOutfits((existing) => [...response.outfits, ...existing]);
      } else {
        const outfit = response.outfit || response;
        setOutfits((existing) => [outfit, ...existing]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate outfit');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWear = async (idx: number) => {
    setError(null);
    setSuccessMessage(null);
    setWearingIdx(idx);
    try {
      const o = displayOutfits[idx];
      const itemIds = o.items?.map((it: any) => it.id) || [];
      const response = await wearOutfit(o.outfitId || o.id, itemIds, o.occasion || occ, weather);
      setSuccessMessage(response.message || "Outfit selected successfully! Enjoy your day.");
    } catch (err: any) {
      setError(err?.message || 'Failed to select outfit');
    } finally {
      setWearingIdx(null);
    }
  };

  const handleRevise = async (idx: number) => {
    setError(null);
    setRevisingIdx(idx);
    try {
      const previousOutfitIds = outfits.map(o => {
        const ids = o.items?.map((it: any) => it.id) || [];
        return ids.sort((a: any, b: any) => Number(a) - Number(b)).join('-');
      }).filter(Boolean);

      const response = await reviseOutfit(occ, weather, previousOutfitIds);
      if (response.exhausted) {
        setError(response.message || "You've explored all possible outfit combinations from your wardrobe. Try uploading more clothes for additional recommendations.");
        return;
      }

      if (response.outfit) {
        setOutfits((prev) => {
          const next = [...prev];
          next[idx] = response.outfit;
          return next;
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to revise outfit');
    } finally {
      setRevisingIdx(null);
    }
  };

  const getOutfitSignature = (o: any) => {
    if (!o || !o.items?.length) return "";
    return o.items.map((it: any) => it.id).sort((a: any, b: any) => Number(a) - Number(b)).join("-");
  };

  const isOutfitLiked = (o: any) => {
    const sig = getOutfitSignature(o);
    if (!sig) return false;
    return likedOutfits.some((liked) => getOutfitSignature(liked) === sig);
  };

  const toggleLikeOutfit = (o: any) => {
    const sig = getOutfitSignature(o);
    if (!sig) return;
    setLikedOutfits((prev) => {
      let next;
      if (prev.some((liked) => getOutfitSignature(liked) === sig)) {
        next = prev.filter((liked) => getOutfitSignature(liked) !== sig);
      } else {
        next = [...prev, { ...o, likedAt: Date.now() }];
      }
      localStorage.setItem("myntra_liked_outfits", JSON.stringify(next));
      return next;
    });
  };

  const handleRemoveOutfit = (idx: number) => {
    if (showLikedOnly) {
      setLikedOutfits((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        localStorage.setItem("myntra_liked_outfits", JSON.stringify(next));
        return next;
      });
    } else if (showCombinations) {
      setCombinations((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setOutfits((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const displayOutfits = showLikedOnly 
    ? likedOutfits 
    : (showCombinations ? combinations : outfits);

  return (
    <section className="bg-gradient-to-b from-secondary/50 to-transparent py-12">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <SectionHeader badge="STYLED BY AI" title="AI Outfit Generator" subtitle="Handpicked combinations from your closet, tailored to your day." />

        <div className="mt-8 flex flex-col md:flex-row md:items-center justify-center gap-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {outfitFilters.map((f) => (
              <button key={f} onClick={() => { setOcc(f); setShowLikedOnly(false); }}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                  occ === f && !showLikedOnly ? "bg-primary text-primary-foreground shadow-[var(--shadow-myntra)]" : "bg-white border border-border text-myntra-dark hover:border-primary"
                }`}>
                {f}
              </button>
            ))}
            <button 
              onClick={() => setShowLikedOnly(!showLikedOnly)}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                showLikedOnly ? "bg-rose-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)]" : "bg-white border border-border text-rose-500 hover:border-rose-500"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showLikedOnly ? "fill-white" : "fill-rose-500"}`} />
              Liked Combos
            </button>
          </div>
          <div className="hidden md:block h-6 w-px bg-border" />
          {detectedWeather ? (
            <div className="inline-flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-full text-xs font-bold text-myntra-dark shadow-sm">
              <span className="flex items-center gap-1 text-primary">📍 {detectedWeather.location?.city || 'Mumbai'}</span>
              <span className="text-muted-foreground/30">|</span>
              <span>{detectedWeather.current?.emoji || '☀️'} {detectedWeather.current?.tempC ?? 28}°C {detectedWeather.current?.condition || 'Sunny'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-full text-xs text-muted-foreground animate-pulse">
              Detecting Weather...
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGenerating ? 'Generating...' : 'Generate Outfit'}
          </button>
        </div>

        {combinations.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowCombinations(!showCombinations)}
              className="text-xs font-semibold text-primary hover:text-primary/80"
            >
              {showCombinations ? 'Show Generated Outfits' : 'Show Wardrobe Combinations'}
            </button>
          </div>
        )}

        {error ? (
          <div className="mt-8 rounded-2xl border border-border bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        ) : null}

        {successMessage ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 flex items-center justify-between shadow-sm animate-fade-in">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold text-lg px-2">×</button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {loading ? (
            <div className="col-span-full rounded-3xl bg-card border border-border p-8 text-center text-sm text-muted-foreground">Loading outfits...</div>
          ) : displayOutfits.length === 0 ? (
            <div className="col-span-full rounded-3xl bg-card border border-border p-8 text-center text-sm text-muted-foreground">
              {showLikedOnly ? (
                <div className="space-y-2">
                  <div>No liked combinations yet.</div>
                  <div className="text-xs text-muted-foreground">Click the heart icon on any outfit combination to save it here.</div>
                </div>
              ) : showCombinations ? (
                <div className="space-y-2">
                  <div>No combinations available.</div>
                  <div className="text-xs text-muted-foreground">Upload wardrobe items with photos to see outfit combinations generated from your closet.</div>
                </div>
              ) : (
                'No generated outfits yet. Click generate to create your first look.'
              )}
            </div>
          ) : (
            displayOutfits.map((o, i) => (
              <motion.div key={o.id ?? o.outfitId ?? i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }} whileHover={{ y: -6 }}
                className="rounded-3xl bg-card border border-border overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:border-primary/40 transition-all">
                <div className={`p-5 border-b border-border flex items-center justify-between ${getScoreBg(o.score)}`}>
                  <div>
                    <h4 className="font-bold text-myntra-dark line-clamp-2">{o.name || 'Outfit Combination'}</h4>
                    {!showCombinations && <p className="text-xs text-muted-foreground mt-0.5">{o.occasion || 'Any Occasion'} · {o.weather || 'Any Weather'}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Match</div>
                      <div className={`text-xl font-black ${getScoreColor(o.score)}`}>{o.score}%</div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeOutfit(o);
                      }}
                      className={`p-1 rounded-full transition-colors ${
                        isOutfitLiked(o) 
                          ? "text-rose-500 hover:bg-rose-50" 
                          : "text-muted-foreground hover:text-rose-500 hover:bg-black/5"
                      }`}
                      title={isOutfitLiked(o) ? "Unlike Outfit" : "Like Outfit"}
                    >
                      <Heart className={`w-4 h-4 ${isOutfitLiked(o) ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveOutfit(i);
                      }}
                      className="p-1 rounded-full hover:bg-black/5 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Remove Outfit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {o.reason && <p className="text-sm leading-6 text-muted-foreground">{o.reason}</p>}
                  {o.items?.length ? (
                    <div className="grid grid-cols-2 gap-2">
                      {o.items.map((item: any, idx: number) => (
                        <div key={idx} className="rounded-2xl border border-border bg-secondary/50 overflow-hidden flex flex-col">
                          <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 flex items-center justify-center">
                            {item.imageUrl && item.imageUrl.trim() ? (
                              <img src={item.imageUrl} alt={item.name || item.category} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center">
                                <div className="text-2xl">📷</div>
                                <div className="text-[10px] text-muted-foreground mt-1">No image</div>
                              </div>
                            )}
                          </div>
                          <div className="p-2 text-[10px] flex-1 flex flex-col justify-between">
                            <div>
                              <div className="font-semibold text-myntra-dark line-clamp-1">{item.name || 'Item'}</div>
                              <div className="text-muted-foreground/80 line-clamp-1">{item.category || 'Unknown'}</div>
                              {item.color && <div className="text-muted-foreground/60 line-clamp-1">{item.color}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-xs text-muted-foreground text-center">
                      No items in this combination
                    </div>
                  )}
                  {!showCombinations && (
                    <div className={showLikedOnly ? "flex" : "grid grid-cols-2 gap-2"}>
                      <button 
                        onClick={() => handleWear(i)}
                        disabled={wearingIdx === i || isGenerating || revisingIdx !== null}
                        className={`inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 ${showLikedOnly ? "w-full" : ""}`}
                      >
                        <Check className="w-3.5 h-3.5" /> 
                        {wearingIdx === i ? 'Selecting...' : 'Wear This'}
                      </button>
                      {!showLikedOnly && (
                        <button 
                          onClick={() => handleRevise(i)}
                          disabled={revisingIdx === i || isGenerating}
                          className="inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-border text-xs font-bold text-myntra-dark hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                        >
                          <Shuffle className={`w-3.5 h-3.5 ${revisingIdx === i ? 'animate-spin' : ''}`} /> 
                          {revisingIdx === i ? 'Revising...' : 'Revise'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
