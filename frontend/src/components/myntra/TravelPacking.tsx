import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plane, Calendar, Tag, Sparkles, Check, Briefcase, 
  RefreshCw, Shirt, Trash2, ShoppingBag, Heart, ExternalLink
} from "lucide-react";
import { 
  getTravelCapsule, getWardrobeItems, addWardrobeItemDirect, addToWishlist 
} from "@/lib/api";
import { SectionHeader } from "./DigitalCloset";

interface CapsuleItem {
  id: string | number;
  name: string;
  category: string;
  color: string;
  occasion: string;
  season: string;
  imageUrl?: string;
  isExtra?: boolean;
  isWishlist?: boolean;
}

interface TravelOutfit {
  id: number;
  name: string;
  dateStr: string;
  items: CapsuleItem[];
  occasion: string;
  notes: string;
}

interface RecommendedProduct {
  productName: string;
  productImage: string;
  brand: string;
  price: number;
  myntraUrl: string;
  category: string;
  color: string;
}

interface MissingOutfitSuggestion {
  name: string;
  description: string;
  items: RecommendedProduct[];
}

const PRODUCT_POOL: RecommendedProduct[] = [
  // ================= TOPWEAR =================
  {
    productName: "Mast & Harbour Tropical Printed Shirt",
    productImage: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
    brand: "Mast & Harbour",
    price: 899,
    myntraUrl: "https://www.myntra.com/shirts",
    category: "Topwear",
    color: "White"
  },
  {
    productName: "Levis White Cotton Solid T-Shirt",
    productImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80",
    brand: "Levis",
    price: 999,
    myntraUrl: "https://www.myntra.com/tshirts",
    category: "Topwear",
    color: "White"
  },
  {
    productName: "U.S. Polo Assn. Grey Slim Fit Polo",
    productImage: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=80",
    brand: "U.S. Polo Assn.",
    price: 1299,
    myntraUrl: "https://www.myntra.com/polo-tshirts",
    category: "Topwear",
    color: "Grey"
  },
  {
    productName: "HRX Men Coral Solid V-Neck Tee",
    productImage: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80",
    brand: "HRX",
    price: 699,
    myntraUrl: "https://www.myntra.com/tshirts",
    category: "Topwear",
    color: "Red"
  },

  // ================= BOTTOMWEAR =================
  {
    productName: "Levis Casual Cotton Chino Shorts",
    productImage: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80",
    brand: "Levis",
    price: 1599,
    myntraUrl: "https://www.myntra.com/shorts",
    category: "Bottomwear",
    color: "Beige"
  },
  {
    productName: "Mast & Harbour Navy Blue Cotton Shorts",
    productImage: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80",
    brand: "Mast & Harbour",
    price: 999,
    myntraUrl: "https://www.myntra.com/shorts",
    category: "Bottomwear",
    color: "Blue"
  },
  {
    productName: "HRX Men Black Dry-Fit Sports Shorts",
    productImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    brand: "HRX",
    price: 1199,
    myntraUrl: "https://www.myntra.com/shorts",
    category: "Bottomwear",
    color: "Black"
  },
  {
    productName: "Roadster Olive Green Cargo Shorts",
    productImage: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
    brand: "Roadster",
    price: 1399,
    myntraUrl: "https://www.myntra.com/shorts",
    category: "Bottomwear",
    color: "Green"
  },

  // ================= FOOTWEAR =================
  {
    productName: "Adidas Duramo Slide Sandals",
    productImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
    brand: "Adidas",
    price: 1299,
    myntraUrl: "https://www.myntra.com/sandals",
    category: "Footwear",
    color: "Black"
  },
  {
    productName: "Crocs Classic Unisex White Clogs",
    productImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    brand: "Crocs",
    price: 2995,
    myntraUrl: "https://www.myntra.com/sandals",
    category: "Footwear",
    color: "White"
  },
  {
    productName: "Solethread Tropical Printed Slides",
    productImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
    brand: "Solethread",
    price: 799,
    myntraUrl: "https://www.myntra.com/sandals",
    category: "Footwear",
    color: "Blue"
  },
  {
    productName: "Nike Lightweight breathable Mesh Slides",
    productImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    brand: "Nike",
    price: 1899,
    myntraUrl: "https://www.myntra.com/sandals",
    category: "Footwear",
    color: "Black"
  }
];

export function TravelPacking() {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState<number>(5);
  const [occasion, setOccasion] = useState("Casual");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [capsuleItems, setCapsuleItems] = useState<CapsuleItem[]>([]);
  const [extraItems, setExtraItems] = useState<CapsuleItem[]>([]);
  const [outfitList, setOutfitList] = useState<TravelOutfit[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<"capsule" | "outfits" | "packed">("capsule");
  const [copied, setCopied] = useState(false);
  const [packedOutfits, setPackedOutfits] = useState<Record<number, boolean>>({});
  
  // Dynamic Spares, Packed States and Discarded Outfits
  const [packedItems, setPackedItems] = useState<Record<string | number, boolean>>({});
  const [discardedOutfits, setDiscardedOutfits] = useState<Record<number, boolean>>({});

  // Suggestion offset state to cycle through matching products
  const [suggestionOffset, setSuggestionOffset] = useState<number>(0);

  // Full Closet items list
  const [allClosetItems, setAllClosetItems] = useState<CapsuleItem[]>([]);

  const loadFullCloset = async () => {
    try {
      const res = await getWardrobeItems({ page: 1, limit: 100 });
      if (res && res.items) {
        setAllClosetItems(res.items);
      }
    } catch (err) {
      console.error("Failed to load closet items for travel advisor:", err);
    }
  };

  useEffect(() => {
    loadFullCloset();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError("Please specify a destination.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuggestionOffset(0); // Reset offsets on fresh generates

    try {
      // Curate Capsule items based on destination, duration and occasion
      const data = await getTravelCapsule({
        destination: destination.trim(),
        duration,
        occasion
      });
      
      if (data.error || data.message) {
        setError(data.message || data.error);
        setCapsuleItems([]);
        setExtraItems([]);
        setOutfitList([]);
      } else {
        const capsule = data.capsule || [];
        const extras = data.extras || [];
        setCapsuleItems(capsule);
        setExtraItems(extras);
        
        // Generate daily itinerary outfit lists based on days only (cycling wardrobe items)
        const allItems = [...capsule, ...extras];
        const tops = allItems.filter(i => i.category === "Topwear" || i.category === "Top");
        const bottoms = allItems.filter(i => i.category === "Bottomwear" || i.category === "Bottom");
        const shoes = allItems.filter(i => i.category === "Footwear" || i.category === "Shoes");
        const outerwear = allItems.filter(i => i.category === "Outerwear" || i.category === "Warmwear");

        const dailyOutfits: TravelOutfit[] = [];
        for (let i = 0; i < duration; i++) {
          const outfitItems: CapsuleItem[] = [];
          
          if (tops.length > 0) outfitItems.push(tops[i % tops.length]);
          if (bottoms.length > 0) outfitItems.push(bottoms[i % bottoms.length]);
          if (shoes.length > 0) outfitItems.push(shoes[i % shoes.length]);
          if (outerwear.length > 0) outfitItems.push(outerwear[i % outerwear.length]);

          dailyOutfits.push({
            id: i + 1,
            name: `${occasion} Day ${i + 1} Outfit`,
            dateStr: `Day ${i + 1}`,
            items: outfitItems,
            occasion: occasion,
            notes: `Coordinated look curated from your packed wardrobe capsule.`
          });
        }

        setOutfitList(dailyOutfits);
        setHasGenerated(true);
        setActiveTab("capsule");
        
        // Mark all core items as packed by default
        const initialPacked: Record<string | number, boolean> = {};
        capsule.forEach((item: CapsuleItem) => {
          initialPacked[item.id] = true;
        });
        setPackedItems(initialPacked);
        setPackedOutfits({});
        setDiscardedOutfits({});
      }
    } catch (err: any) {
      setError(err?.message || "Failed to generate packing list.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyItem = async (rec: any) => {
    try {
      const payload = {
        name: rec.productName,
        category: rec.category,
        color: rec.color || "Black",
        occasion: "Travel",
        season: "All Season",
        brand: rec.brand,
        imageUrl: rec.productImage,
        notes: "Purchased from Travel weather suggestions",
        favorite: false
      };
      
      const res = await addWardrobeItemDirect(payload);
      alert(`"${rec.productName}" purchased successfully & added to your digital wardrobe!`);
      
      // Reload user wardrobe list
      await loadFullCloset();
      
      // Add dynamically to current travel list
      const simulatedItem: CapsuleItem = {
        id: res?.item?.id || Math.random().toString(),
        name: rec.productName,
        category: rec.category,
        color: rec.color,
        occasion: "Travel",
        season: "All Season",
        imageUrl: rec.productImage,
        isExtra: true
      };
      setCapsuleItems(prev => [simulatedItem, ...prev]);
    } catch (err) {
      console.error("Failed to buy wardrobe item:", err);
      alert("Failed to buy item.");
    }
  };

  const handleAddWishlist = async (rec: any) => {
    try {
      const payload = {
        productName: rec.productName,
        productImage: rec.productImage,
        brand: rec.brand,
        price: rec.price,
        myntraUrl: rec.myntraUrl
      };
      await addToWishlist(payload);
      alert(`"${rec.productName}" added to your Myntra Wishlist!`);
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
      alert("Failed to add item to wishlist.");
    }
  };

  const handleReviseOutfits = () => {
    // Revise daily looks using currently packed items list
    const selectedItems = [...capsuleItems, ...extraItems].filter((item: CapsuleItem) => packedItems[item.id]);
    
    if (selectedItems.length === 0) {
      alert("Please select at least some items in your capsule to pack first!");
      return;
    }

    const tops = selectedItems.filter(i => i.category === 'Topwear');
    const bottoms = selectedItems.filter(i => i.category === 'Bottomwear');
    const shoes = selectedItems.filter(i => i.category === 'Footwear');
    const outerwear = selectedItems.filter(i => i.category === 'Outerwear');

    setOutfitList(prev => prev.map((outfit, idx) => {
      const items: CapsuleItem[] = [];
      if (tops.length > 0) items.push(tops[(idx + Math.floor(Math.random() * 3)) % tops.length]);
      if (bottoms.length > 0) items.push(bottoms[(idx + Math.floor(Math.random() * 3)) % bottoms.length]);
      if (shoes.length > 0) items.push(shoes[(idx + Math.floor(Math.random() * 3)) % shoes.length]);
      if (outerwear.length > 0) items.push(outerwear[Math.floor(Math.random() * outerwear.length)]);

      return {
        ...outfit,
        items
      };
    }));

    setPackedOutfits({});
    setDiscardedOutfits({});
    setActiveTab("outfits");
  };

  const handleRemoveItem = (id: string | number) => {
    const updatedCapsule = capsuleItems.filter(item => item.id !== id);
    const updatedExtras = extraItems.filter(item => item.id !== id);
    
    setCapsuleItems(updatedCapsule);
    setExtraItems(updatedExtras);
    
    setOutfitList(prev => prev.map(outfit => ({
      ...outfit,
      items: outfit.items.filter(item => item.id !== id)
    })));
  };

  const handleRemoveOutfit = (id: number) => {
    setDiscardedOutfits(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const handleReviseSingleOutfit = (outfitId: number) => {
    const selectedItems = [...capsuleItems, ...extraItems].filter((item: CapsuleItem) => packedItems[item.id]);
    if (selectedItems.length === 0) return;

    const tops = selectedItems.filter(i => i.category === 'Topwear');
    const bottoms = selectedItems.filter(i => i.category === 'Bottomwear');
    const shoes = selectedItems.filter(i => i.category === 'Footwear');
    const outerwear = selectedItems.filter(i => i.category === 'Outerwear');

    setOutfitList(prev => prev.map(outfit => {
      if (outfit.id !== outfitId) return outfit;

      const items: CapsuleItem[] = [];
      if (tops.length > 0) items.push(tops[Math.floor(Math.random() * tops.length)]);
      if (bottoms.length > 0) items.push(bottoms[Math.floor(Math.random() * bottoms.length)]);
      if (shoes.length > 0) items.push(shoes[Math.floor(Math.random() * shoes.length)]);
      if (outerwear.length > 0) items.push(outerwear[Math.floor(Math.random() * outerwear.length)]);

      return {
        ...outfit,
        items
      };
    }));

    setPackedOutfits(prev => ({
      ...prev,
      [outfitId]: false
    }));
  };

  const togglePackedItem = (id: string | number) => {
    setPackedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyPackingList = () => {
    const listText = [
      `🧳 TRAVEL PACKING LIST FOR ${destination.toUpperCase()}`,
      `📅 Duration: ${duration} Days | Occasion: ${occasion}`,
      `---------------------------------------`,
      `👕 CORE CAPSULE ITEMS:`,
      ...capsuleItems.map(i => `- [ ] ${i.name} (${i.category} - ${i.color})`),
      `\n➕ BACKUP & SPARE ITEMS:`,
      ...extraItems.map(i => `- [ ] ${i.name} (${i.category} - ${i.color})`),
      `\nGenerated by Myntra AI Smart Closet`
    ].join("\n");

    navigator.clipboard.writeText(listText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePackedOutfit = (id: number) => {
    setPackedOutfits(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const allItemsGrouped = [...capsuleItems, ...extraItems].reduce((groups, item) => {
    const cat = item.category || "Accessories";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
    return groups;
  }, {} as Record<string, CapsuleItem[]>);

  const packedOutfitsList = outfitList.filter(o => !discardedOutfits[o.id] && packedOutfits[o.id]);

  // Determine missing outfit suggestions dynamically
  const getMissingOutfitSuggestion = (): MissingOutfitSuggestion | null => {
    const fitTops = PRODUCT_POOL.filter(p => p.category === "Topwear");
    const fitBottoms = PRODUCT_POOL.filter(p => p.category === "Bottomwear");
    const fitFoots = PRODUCT_POOL.filter(p => p.category === "Footwear");
    
    const items: RecommendedProduct[] = [];
    
    // Choose products matching the current suggestionOffset loop index (exactly 3 items)
    if (fitTops.length > 0) {
      items.push(fitTops[suggestionOffset % fitTops.length]);
    }
    if (fitBottoms.length > 0) {
      items.push(fitBottoms[suggestionOffset % fitBottoms.length]);
    }
    if (fitFoots.length > 0) {
      items.push(fitFoots[suggestionOffset % fitFoots.length]);
    }

    if (items.length > 0) {
      return {
        name: "Coordinated Travel Outfit Suggestion",
        description: "A complete 3-piece coordinated coordinate recommended for your travels. Swipe to generate alternative styles.",
        items
      };
    }

    return null;
  };

  const missingOutfit = getMissingOutfitSuggestion();

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-12">
      <SectionHeader 
        badge="TRAVEL PLANNER" 
        title="Smart Travel Packing" 
        subtitle="Pack lighter and style smarter. Curate a color-coordinated capsule wardrobe tailored to your destination." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10 items-start">
        {/* Left Form Panel */}
        <div className="lg:col-span-4 rounded-3xl border border-border bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-md font-bold text-myntra-dark flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Configure Trip Details
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-semibold">Let AI select the minimum set of items to yield maximum outfit options.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-myntra-dark uppercase tracking-wider block">Destination</label>
              <div className="relative">
                <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. Goa, Paris, Kashmir"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-myntra-dark uppercase tracking-wider block">Duration (Days)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-myntra-dark uppercase tracking-wider block">Occasion</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white"
                  >
                    <option value="Casual">Casual</option>
                    <option value="Formal">Formal</option>
                    <option value="Sports">Sports</option>
                    <option value="Party">Party</option>
                    <option value="Travel">Travel</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Curating Capsule...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Curate Travel Closet
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-xs text-red-700 leading-relaxed flex items-start gap-1.5">
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-8 space-y-6">
          {!hasGenerated ? (
            /* Welcome Empty State */
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <Briefcase className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-lg font-bold text-myntra-dark">No Trip Planned Yet</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your destination details on the left. The styling assistant will pick a matching palette from your wardrobe, scaling the capsule and adding extra backup items based on your trip length.
                </p>
              </div>
            </div>
          ) : (
            /* Result Panel */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-br from-primary/5 to-purple-500/5 border border-border p-6 rounded-3xl">
                <div>
                  <h3 className="text-lg font-black text-myntra-dark flex items-center gap-2">
                    🎯 Trip to {destination}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {duration} Days · {occasion} styling theme · Curated {capsuleItems.length} core items + {extraItems.length} backup spares.
                  </p>
                </div>
              </div>

              {/* Tabs navigation */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("capsule")}
                  className={`pb-3.5 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === "capsule"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-myntra-dark"
                  }`}
                >
                  <Shirt className="w-4 h-4" /> Curated Capsule ({capsuleItems.length + extraItems.length} Items)
                </button>
                <button
                  onClick={() => setActiveTab("outfits")}
                  className={`pb-3.5 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === "outfits"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-myntra-dark"
                  }`}
                >
                  <Sparkles className="w-4 h-4 animate-pulse" /> Daily Itinerary Outfits ({outfitList.filter(o => !discardedOutfits[o.id]).length})
                </button>
                <button
                  onClick={() => setActiveTab("packed")}
                  className={`pb-3.5 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === "packed"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-myntra-dark"
                  }`}
                >
                  <Check className="w-4 h-4" /> Packed Daily Outfits ({outfitList.filter(o => !discardedOutfits[o.id] && packedOutfits[o.id]).length})
                </button>
              </div>

              {/* Tab Contents */}
              <AnimatePresence mode="wait">
                {activeTab === "capsule" ? (
                  /* Capsule items view */
                  <motion.div
                    key="capsule-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Packed Progress Tracker */}
                    <div className="bg-secondary/20 border border-border p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-0.5 text-center sm:text-left">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Packing Checklist</span>
                        <div className="text-sm font-bold text-myntra-dark">
                          Packed {Object.values(packedItems).filter(Boolean).length} of {capsuleItems.length + extraItems.length} items
                        </div>
                      </div>
                      <div className="w-48 bg-secondary h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${((Object.values(packedItems).filter(Boolean).length) / (capsuleItems.length + extraItems.length || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {Object.entries(allItemsGrouped).map(([category, items]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-xs font-black text-myntra-dark uppercase tracking-wider border-l-2 border-primary pl-2">
                          {category}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className={`group rounded-2xl overflow-hidden bg-card border transition-all flex flex-col justify-between relative ${
                                item.isExtra 
                                  ? "border-purple-200 hover:border-purple-300 bg-purple-50/20" 
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No Image</div>
                                )}
                                
                                <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveItem(item.id);
                                    }}
                                    className="p-1 rounded-full bg-white hover:bg-red-50 text-muted-foreground hover:text-red-500 shadow-sm transition-all border border-border hover:scale-115"
                                    title="Remove from travel list"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  {item.isExtra ? (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[8px] font-black tracking-wider shadow-sm uppercase">
                                      Backup Spare
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[8px] font-black tracking-wider shadow-sm uppercase">
                                      Core Item
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="p-3 space-y-1">
                                <h5 className="text-xs font-bold text-myntra-dark line-clamp-1">{item.name}</h5>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full border border-border"
                                    style={{ backgroundColor: item.color.toLowerCase() }}
                                  />
                                  <span className="text-[10px] text-muted-foreground">{item.color}</span>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-secondary/50">
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!packedItems[item.id]}
                                      onChange={() => togglePackedItem(item.id)}
                                      className="rounded text-primary border-border focus:ring-primary/20 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className="text-[10px] font-bold text-myntra-dark">Packed</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : activeTab === "outfits" ? (
                  /* Daily Itinerary Outfits */
                  <motion.div
                    key="outfits-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                  >
                    {outfitList.filter(o => !discardedOutfits[o.id]).map((outfit) => (
                      <div
                        key={outfit.id}
                        className={`rounded-3xl border p-6 bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-5 ${
                          packedOutfits[outfit.id] 
                            ? "border-emerald-200 bg-emerald-50/10" 
                            : "border-border"
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-black text-[9px] uppercase tracking-wider">
                                  {outfit.dateStr}
                                </span>
                              </div>
                              <h4 className="text-base font-black text-myntra-dark flex items-center gap-1.5 mt-1.5">
                                {outfit.name}
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                {outfit.notes}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleReviseSingleOutfit(outfit.id)}
                                className="p-2 rounded-full border border-border hover:bg-primary/5 hover:text-primary text-muted-foreground transition-all bg-white"
                                title="Revise this outfit combination"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveOutfit(outfit.id)}
                                className="p-2 rounded-full border border-border hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-all bg-white"
                                title="Remove combo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => togglePackedOutfit(outfit.id)}
                                className={`p-2 rounded-full border transition-all ${
                                  packedOutfits[outfit.id]
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-border hover:bg-secondary text-muted-foreground bg-white"
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Render combo items in a grid layout matching visual photo cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-secondary/15 p-4 rounded-2xl">
                            {outfit.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="group rounded-2xl overflow-hidden bg-white border border-border flex flex-col justify-between relative shadow-sm hover:border-primary/20 transition-all"
                              >
                                <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No Image</div>
                                  )}
                                </div>
                                <div className="p-3 space-y-0.5 bg-white">
                                  <h5 className="text-[11px] font-black text-myntra-dark line-clamp-1 leading-snug">{item.name}</h5>
                                  <div className="text-[9px] text-muted-foreground uppercase font-semibold">{item.category}</div>
                                  <div className="text-[9px] text-muted-foreground">{item.color}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-secondary/50 text-[10px] text-muted-foreground">
                          <span>Occasion: {outfit.occasion}</span>
                          {packedOutfits[outfit.id] && (
                            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                              ✓ Packed Outfit
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {outfitList.filter(o => !discardedOutfits[o.id]).length === 0 && (
                      <div className="col-span-2 rounded-3xl border border-border p-12 text-center text-sm text-muted-foreground bg-card">
                        No outfit combinations could be generated.
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* Selected packed outfits view */
                  <motion.div
                    key="packed-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {/* Packing Checklist Progress Widget */}
                    {packedOutfitsList.length > 0 && (
                      <div className="bg-card border border-border p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="space-y-1 text-center sm:text-left">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Packing Checklist</span>
                          <div className="text-lg font-black text-myntra-dark">
                            Packed {Object.values(packedItems).filter(Boolean).length} of {capsuleItems.length + extraItems.length} items
                          </div>
                        </div>
                        <div className="w-full sm:w-64 bg-secondary h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${((Object.values(packedItems).filter(Boolean).length) / (capsuleItems.length + extraItems.length || 1)) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Selected outfit combos grid */}
                    {packedOutfitsList.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <h4 className="text-xs font-black text-myntra-dark uppercase tracking-wider border-l-2 border-primary pl-2">
                          Packed Day Outfits
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {packedOutfitsList.map((outfit) => (
                            <div
                              key={outfit.id}
                              className="rounded-3xl border border-emerald-200 bg-emerald-50/5 p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                            >
                              <div className="space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[9px] uppercase tracking-wider">
                                        {outfit.dateStr}
                                      </span>
                                    </div>
                                    <h4 className="text-base font-black text-myntra-dark flex items-center gap-1.5 mt-1.5">
                                      {outfit.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                      {outfit.notes}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => handleReviseSingleOutfit(outfit.id)}
                                      className="p-2 rounded-full border border-border hover:bg-primary/5 hover:text-primary text-muted-foreground transition-all bg-white"
                                      title="Revise this outfit combination"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveOutfit(outfit.id)}
                                      className="p-2 rounded-full border border-border hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-all bg-white"
                                      title="Remove combo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => togglePackedOutfit(outfit.id)}
                                      className="p-2 rounded-full bg-emerald-500 border border-emerald-500 text-white transition-all hover:bg-emerald-600"
                                      title="Unpack combo"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Render combo items in a grid layout matching visual photo cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-secondary/15 p-4 rounded-2xl">
                                  {outfit.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="group rounded-2xl overflow-hidden bg-white border border-border flex flex-col justify-between relative shadow-sm hover:border-primary/20 transition-all"
                                    >
                                      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                                        {item.imageUrl ? (
                                          <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                          />
                                        ) : (
                                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No Image</div>
                                        )}
                                      </div>
                                      <div className="p-3 space-y-0.5 bg-white">
                                        <h5 className="text-[11px] font-black text-myntra-dark line-clamp-1 leading-snug">{item.name}</h5>
                                        <div className="text-[9px] text-muted-foreground uppercase font-semibold">{item.category}</div>
                                        <div className="text-[9px] text-muted-foreground">{item.color}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-3 border-t border-secondary/50 text-[10px] text-muted-foreground">
                                <span>Occasion: {outfit.occasion}</span>
                                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                  ✓ Packed Outfit
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {packedOutfitsList.length === 0 && (
                      <div className="col-span-2 rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card">
                        No outfits marked as packed yet. Go to "Daily Itinerary Outfits" and check your favorite styling combinations to pack them for the trip!
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Coordinated Missing Outfits recommendations section (Exactly 3 photos) */}
              {missingOutfit && (
                <div className="border-t border-border pt-8 mt-8 space-y-6 animate-fade-in">
                  <div className="flex flex-col">
                    <h3 className="text-md font-black text-myntra-dark uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary animate-pulse" /> 🛍️ Recommended Outfits to Buy (Missing from your Wardrobe)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on your trip details, we suggest taking the following coordinated outfit. Since you do not own some or all of these items, you can buy individual items, add them to your wishlist, or cycle and generate other matches.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-sm font-black text-myntra-dark uppercase tracking-wider">{missingOutfit.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{missingOutfit.description}</p>
                      </div>
                      <button
                        onClick={() => setSuggestionOffset(prev => prev + 1)}
                        className="h-10 px-5 bg-white border border-border hover:bg-slate-50 text-myntra-dark font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" /> Generate Other Option
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {missingOutfit.items.map((prod, idx) => (
                        <div key={idx} className="rounded-2xl border border-border bg-white p-3 flex flex-col justify-between hover:shadow-md transition-all group">
                          <div 
                            onClick={() => window.open(prod.myntraUrl, '_blank')}
                            className="aspect-[3/4] rounded-xl overflow-hidden bg-secondary relative cursor-pointer"
                          >
                            <img src={prod.productImage} alt={prod.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute top-2 left-2 bg-primary/90 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs uppercase">
                              {prod.category}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xs">
                              ₹{prod.price}
                            </div>
                          </div>
                          
                          <div className="mt-3 space-y-1">
                            <h5 
                              onClick={() => window.open(prod.myntraUrl, '_blank')}
                              className="text-xs font-bold text-myntra-dark line-clamp-1 cursor-pointer hover:text-primary leading-tight"
                            >
                              {prod.productName}
                            </h5>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">{prod.brand}</p>
                            
                            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-secondary/50 mt-2">
                              <button
                                onClick={() => window.open(prod.myntraUrl, '_blank')}
                                className="py-2 rounded-xl border border-border hover:bg-primary/5 text-primary hover:text-primary font-bold text-[9px] flex items-center justify-center gap-0.5 transition"
                                title="View on Myntra Store"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Myntra
                              </button>
                              <button
                                onClick={() => handleAddWishlist(prod)}
                                className="py-2 rounded-xl border border-border hover:bg-red-50 text-slate-500 hover:text-red-500 font-bold text-[9px] flex items-center justify-center gap-0.5 transition"
                                title="Add to Wishlist"
                              >
                                <Heart className="w-3.5 h-3.5" /> Wishlist
                              </button>
                              <button
                                onClick={() => handleBuyItem(prod)}
                                className="py-2 bg-[#ff3f6c] hover:bg-[#ff3f6c]/90 text-white font-bold text-[9px] rounded-xl flex items-center justify-center gap-0.5 shadow transition"
                                title="Buy & Add to Wardrobe"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" /> Buy
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
