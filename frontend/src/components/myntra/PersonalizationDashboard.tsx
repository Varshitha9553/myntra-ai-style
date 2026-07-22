import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, BarChart2, Star, Clock } from "lucide-react";
import { getPersonalizationProfile, getPersonalizationInsights, getPersonalizationAnalytics } from "@/lib/api";
import { SectionHeader } from "./DigitalCloset";

export function PersonalizationDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [profData, insData, analData] = await Promise.all([
        getPersonalizationProfile(),
        getPersonalizationInsights(),
        getPersonalizationAnalytics()
      ]);
      setProfile(profData);
      setInsights(insData);
      setAnalytics(analData);
    } catch (err) {
      console.error("Failed to load personalization dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    const handleClosetUpdate = () => {
      void loadData();
    };
    window.addEventListener("closet_updated", handleClosetUpdate);
    return () => {
      window.removeEventListener("closet_updated", handleClosetUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6 space-y-6">
        <div className="h-10 bg-secondary/50 rounded-xl animate-pulse w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-secondary/50 rounded-3xl animate-pulse" />
          <div className="h-64 bg-secondary/50 rounded-3xl animate-pulse" />
          <div className="h-64 bg-secondary/50 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const welcomeText = profile?.totalItems > 0 
    ? `Welcome back! Your style signature is ${profile.dominantStyle}.`
    : "Welcome to your AI Closet! Add some clothes to begin styling.";
  
  const statusText = profile?.totalItems > 0
    ? `Your wardrobe is ready for ${profile.favoriteOccasion.toLowerCase()} wear this week, with ${profile.favoriteColor} forming your base theme.`
    : "Upload your items to analyze style patterns.";

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 border-t border-border/50">
      <SectionHeader badge="PERSONALIZATION" title="My Style Summary" subtitle="Continuously learning from your wardrobe to adapt your style profile." />

      {/* Personalized Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 border border-primary/20 p-6 flex items-start gap-4 shadow-sm"
      >
        <div className="p-3 bg-white rounded-2xl shadow-sm text-primary shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-myntra-dark">{welcomeText}</h3>
          <p className="text-xs text-muted-foreground mt-1">{statusText}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Style Summary Card */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-4">
              <Star className="w-4 h-4" /> Closet Stats
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-secondary">
                <span className="text-xs text-muted-foreground">Total Wardrobe Items</span>
                <span className="text-sm font-black text-myntra-dark">{profile?.totalItems}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-secondary">
                <span className="text-xs text-muted-foreground">Dominant Style</span>
                <span className="text-sm font-black text-myntra-dark">{profile?.dominantStyle}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-secondary">
                <span className="text-xs text-muted-foreground">Favorite Category</span>
                <span className="text-sm font-black text-myntra-dark">{profile?.favoriteCategory}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-secondary">
                <span className="text-xs text-muted-foreground">Favorite Color</span>
                <span className="text-sm font-black text-myntra-dark">{profile?.favoriteColor}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-secondary">
                <span className="text-xs text-muted-foreground">Most Used Occasion</span>
                <span className="text-sm font-black text-myntra-dark">{profile?.favoriteOccasion}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-6 pt-4 border-t border-secondary">
            <Clock className="w-3.5 h-3.5" /> Last Closet Update: {profile?.lastUpdated}
          </div>
        </div>

        {/* AI Style Insights Panel */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Personalized AI Insights
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex gap-2.5 items-start p-3 bg-secondary/30 rounded-2xl border border-secondary/50">
                <span className="text-xs mt-0.5">✨</span>
                <p className="text-xs leading-relaxed text-myntra-dark font-medium">{insight}</p>
              </div>
            ))}
            {insights.length === 0 && (
              <p className="text-xs text-muted-foreground">No insights available. Start adding clothes to generate style insights.</p>
            )}
          </div>
        </div>

        {/* Wardrobe Analytics (Progress Bars) */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <BarChart2 className="w-4 h-4" /> Wardrobe Distributions
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {/* Category distribution */}
            {analytics?.categories?.slice(0, 3).map((cat: any) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-myntra-dark">
                  <span>{cat.name}</span>
                  <span>{cat.count} items ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}

            {/* Colors distribution */}
            {analytics?.colors?.slice(0, 3).map((col: any) => (
              <div key={col.name} className="space-y-1.5 pt-2 border-t border-secondary/40">
                <div className="flex justify-between text-[10px] font-bold text-myntra-dark">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: col.name.toLowerCase() }} />
                    {col.name}
                  </span>
                  <span>{col.count} items ({col.percentage}%)</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${col.percentage}%` }} />
                </div>
              </div>
            ))}

            {/* Occasion distribution */}
            {analytics?.occasions?.slice(0, 3).map((occ: any) => (
              <div key={occ.name} className="space-y-1.5 pt-2 border-t border-secondary/40">
                <div className="flex justify-between text-[10px] font-bold text-myntra-dark">
                  <span>{occ.name}</span>
                  <span>{occ.percentage}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${occ.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
