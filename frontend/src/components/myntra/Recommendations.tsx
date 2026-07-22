import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, ShoppingBag } from "lucide-react";
import { getRecommendations, addToWishlist, getWardrobeItems, getWishlist, addWardrobeItemDirect } from "@/lib/api";
import { SectionHeader } from "./DigitalCloset";

interface NewArrivalProduct {
  name: string;
  category: string;
  color: string;
  pattern: string;
  season: string;
  occasion: string;
  price: number;
  imageUrl: string;
  myntraUrl: string;
}

const NEW_ARRIVALS_POOL: NewArrivalProduct[] = [
  {
    name: "Nike Air Max Pulse Sneakers",
    category: "Footwear",
    color: "White",
    pattern: "Solid",
    season: "All Season",
    occasion: "Sports",
    price: 9999,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    myntraUrl: "https://www.myntra.com/shoes/nike/nike-men-white-air-max-pulse-sneakers/30120938/buy"
  },
  {
    name: "Roadster Black Denim Jeans",
    category: "Bottomwear",
    color: "Black",
    pattern: "Solid",
    season: "All Season",
    occasion: "Casual",
    price: 1299,
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
    myntraUrl: "https://www.myntra.com/jeans/roadster/roadster-men-black-slim-fit-denim-jeans/30129845/buy"
  },
  {
    name: "Tommy Hilfiger Blue Cotton Shirt",
    category: "Topwear",
    color: "Blue",
    pattern: "Solid",
    season: "All Season",
    occasion: "Casual",
    price: 3499,
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
    myntraUrl: "https://www.myntra.com/shirts/tommy-hilfiger/tommy-hilfiger-men-blue-casual-shirt/30142981/buy"
  },
  {
    name: "Levis Slim Fit Chino Trousers",
    category: "Bottomwear",
    color: "Beige",
    pattern: "Solid",
    season: "All Season",
    occasion: "Office",
    price: 2299,
    imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80",
    myntraUrl: "https://www.myntra.com/chinos/levis/levis-men-beige-slim-fit-chinos/30143924/buy"
  },
  {
    name: "Adidas Ultraboost Running Shoes",
    category: "Footwear",
    color: "Blue",
    pattern: "Solid",
    season: "All Season",
    occasion: "Sports",
    price: 12999,
    imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80",
    myntraUrl: "https://www.myntra.com/shoes/adidas/adidas-men-blue-ultraboost-running-shoes/30188921/buy"
  },
  {
    name: "Wrogn Olive Bomber Jacket",
    category: "Outerwear",
    color: "Green",
    pattern: "Solid",
    season: "Winter",
    occasion: "Casual",
    price: 2799,
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80",
    myntraUrl: "https://www.myntra.com/jackets/wrogn/wrogn-men-olive-solid-bomber-jacket/30143982/buy"
  },
  {
    name: "Fossil Analog Blue Dial Watch",
    category: "Accessories",
    color: "Blue",
    pattern: "Solid",
    season: "All Season",
    occasion: "Casual",
    price: 6999,
    imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&q=80",
    myntraUrl: "https://www.myntra.com/watches/fossil/fossil-analog-blue-dial-watch/30122981/buy"
  },
  {
    name: "US Polo Assn White Polo T-Shirt",
    category: "Topwear",
    color: "White",
    pattern: "Solid",
    season: "Summer",
    occasion: "Casual",
    price: 1499,
    imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=80",
    myntraUrl: "https://www.myntra.com/tshirts/us-polo/us-polo-men-white-polo-tshirt/30155231/buy"
  },
  {
    name: "H&M Linen Pink Dress",
    category: "Dress",
    color: "Pink",
    pattern: "Floral",
    season: "Summer",
    occasion: "Casual",
    price: 2299,
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80",
    myntraUrl: "https://www.myntra.com/dresses/hm/hm-women-pink-linen-blend-dress/30120033/buy"
  },
  {
    name: "Red Tape White Walking Shoes",
    category: "Footwear",
    color: "White",
    pattern: "Solid",
    season: "All Season",
    occasion: "Casual",
    price: 1799,
    imageUrl: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80",
    myntraUrl: "https://www.myntra.com/shoes/red-tape/men-white-walking-shoes/30177221/buy"
  },
  {
    name: "Puma Black Graphic Printed Hoodie",
    category: "Outerwear",
    color: "Black",
    pattern: "Graphic",
    season: "Winter",
    occasion: "Casual",
    price: 2499,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80",
    myntraUrl: "https://www.myntra.com/hoodies/puma/puma-black-graphic-printed-hoodie/30166221/buy"
  },
  {
    name: "Daniel Wellington Rose Gold Watch",
    category: "Accessories",
    color: "Gold",
    pattern: "Solid",
    season: "All Season",
    occasion: "Formal",
    price: 11999,
    imageUrl: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&q=80",
    myntraUrl: "https://www.myntra.com/watches/daniel-wellington/rose-gold-unisex-watch/30122999/buy"
  },
  {
    name: "Jack & Jones Jogger Pants",
    category: "Bottomwear",
    color: "Grey",
    pattern: "Solid",
    season: "All Season",
    occasion: "Casual",
    price: 1599,
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
    myntraUrl: "https://www.myntra.com/joggers/jack-jones/men-grey-jogger-pants/30133881/buy"
  },
  {
    name: "Roadster Checked Casual Shirt",
    category: "Topwear",
    color: "Navy",
    pattern: "Checked",
    season: "All Season",
    occasion: "Casual",
    price: 999,
    imageUrl: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400&q=80",
    myntraUrl: "https://www.myntra.com/shirts/roadster/men-navy-checked-shirt/30144991/buy"
  },
  {
    name: "Levis White Crewneck T-Shirt",
    category: "Topwear",
    color: "White",
    pattern: "Solid",
    season: "Summer",
    occasion: "Casual",
    price: 1199,
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80",
    myntraUrl: "https://www.myntra.com/tshirts/levis/men-white-crewneck-tshirt/30120199/buy"
  },
  {
    name: "Nike Black Sports Shorts",
    category: "Bottomwear",
    color: "Black",
    pattern: "Solid",
    season: "Summer",
    occasion: "Sports",
    price: 1899,
    imageUrl: "https://images.unsplash.com/photo-1591258370574-3405c5d7a211?w=400&q=80",
    myntraUrl: "https://www.myntra.com/shorts/nike/men-black-sports-shorts/30111922/buy"
  },
  {
    name: "H&M Black Slim Fit Trousers",
    category: "Bottomwear",
    color: "Black",
    pattern: "Solid",
    season: "All Season",
    occasion: "Formal",
    price: 2299,
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
    myntraUrl: "https://www.myntra.com/trousers/hm/men-black-slim-fit-trousers/30122991/buy"
  },
  {
    name: "Roadster Brown Leather Boots",
    category: "Footwear",
    color: "Brown",
    pattern: "Solid",
    season: "Winter",
    occasion: "Casual",
    price: 3499,
    imageUrl: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400&q=80",
    myntraUrl: "https://www.myntra.com/shoes/roadster/men-brown-leather-boots/30138921/buy"
  },
  {
    name: "Tommy Hilfiger Olive Green Polo",
    category: "Topwear",
    color: "Green",
    pattern: "Solid",
    season: "Summer",
    occasion: "Casual",
    price: 2499,
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80",
    myntraUrl: "https://www.myntra.com/tshirts/tommy-hilfiger/men-olive-green-polo/30155662/buy"
  },
  {
    name: "H&M Floral Print Summer Dress",
    category: "Dress",
    color: "Multi",
    pattern: "Floral",
    season: "Summer",
    occasion: "Casual",
    price: 2999,
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80",
    myntraUrl: "https://www.myntra.com/dresses/hm/women-floral-print-summer-dress/30144552/buy"
  }
];

const gapDetails: Record<string, { image: string; desc: string }> = {
  "White Shirt": {
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
    desc: "Wardrobe foundation piece"
  },
  "White Formal Shirt": {
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
    desc: "Wardrobe foundation piece"
  },
  "Black Blazer": {
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
    desc: "Elevates formal and smart casual looks"
  },
  "Neutral Blazer": {
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
    desc: "Elevates formal and smart casual looks"
  },
  "Beige Trousers": {
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80",
    desc: "Adds a neutral base for many outfits"
  },
  "Black Trousers": {
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80",
    desc: "Adds a neutral base for many outfits"
  },
  "White Sneakers": {
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    desc: "Matches casual and smart looks"
  },
  "Black Sneakers": {
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    desc: "Matches casual and smart looks"
  },
  "Blue Jeans": {
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
    desc: "Everyday rugged versatile classic"
  },
  "Blue Denim Jeans": {
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
    desc: "Everyday rugged versatile classic"
  },
  "Casual Jacket": {
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80",
    desc: "Versatile outer layer for cool days"
  },
  "Analog Watch": {
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&q=80",
    desc: "Timeless accessory for any style"
  }
};

const getGapDetails = (name: string) => {
  return gapDetails[name] || {
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80",
    desc: "Crucial item to balance your wardrobe possibilities."
  };
};

const getMyntraCategoryUrl = (category: string) => {
  const cat = category.toLowerCase().trim();
  if (cat.includes('topwear')) {
    return 'https://www.myntra.com/men-topwear';
  } else if (cat.includes('bottomwear')) {
    return 'https://www.myntra.com/men-bottomwear';
  } else if (cat.includes('footwear')) {
    return 'https://www.myntra.com/men-footwear';
  } else if (cat.includes('accessories') || cat.includes('accessory')) {
    return 'https://www.myntra.com/accessories';
  } else if (cat.includes('outerwear')) {
    return 'https://www.myntra.com/men-jackets';
  } else if (cat.includes('dress')) {
    return 'https://www.myntra.com/dresses';
  }
  return 'https://www.myntra.com';
};

export function Recommendations() {
  const [styleProfile, setStyleProfile] = useState<any>(null);
  const [wardrobeGaps, setWardrobeGaps] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New arrivals states
  const [personalRecs, setPersonalRecs] = useState<NewArrivalProduct[]>([]);
  const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  const generatePersonalRecs = (wardrobeList: any[], wishlistList: any[]) => {
    const wardrobeNames = new Set(wardrobeList.map(wi => String(wi.name || '').trim().toLowerCase()));
    let candidates = NEW_ARRIVALS_POOL.filter(item => !wardrobeNames.has(item.name.trim().toLowerCase()));

    const wishlistCats = new Set(wishlistList.map(wi => String(wi.category || wi.brand || '').trim().toLowerCase()));
    const wishlistColors = new Set(wishlistList.map(wi => String(wi.color || '').trim().toLowerCase()));

    candidates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (wishlistCats.has(a.category.toLowerCase())) scoreA += 2;
      if (wishlistColors.has(a.color.toLowerCase())) scoreA += 1;

      if (wishlistCats.has(b.category.toLowerCase())) scoreB += 2;
      if (wishlistColors.has(b.color.toLowerCase())) scoreB += 1;

      return scoreB - scoreA;
    });

    const topCandidates = candidates.slice(0, 12);
    const shuffled = [...topCandidates].sort(() => Math.random() - 0.5);
    setPersonalRecs(shuffled.slice(0, 5));
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRecommendations();
        setStyleProfile(data.styleProfile || null);
        setWardrobeGaps(data.wardrobeGaps || []);
        setRecommendations(data.recommendations || []);

        const wardrobeData = await getWardrobeItems();
        setWardrobeItems(wardrobeData || []);

        let wishlistData = [];
        try {
          wishlistData = await getWishlist();
          setWishlistItems(wishlistData || []);
        } catch (wErr) {
          console.warn("Failed to fetch wishlist:", wErr);
        }

        generatePersonalRecs(wardrobeData || [], wishlistData || []);
      } catch (err: any) {
        setError(err?.message || 'Unable to load recommendations.');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const handleBuy = async (item: NewArrivalProduct) => {
    try {
      await addWardrobeItemDirect({
        name: item.name,
        category: item.category,
        color: item.color,
        pattern: item.pattern,
        season: item.season,
        occasion: item.occasion,
        imageUrl: item.imageUrl,
        brand: item.name.split(' ')[0],
        notes: "Purchased from Personalized Recommendations",
        favorite: false
      });
      alert(`Successfully purchased and added "${item.name}" to your Wardrobe!`);
      
      const updatedWardrobe = await getWardrobeItems();
      setWardrobeItems(updatedWardrobe || []);
      generatePersonalRecs(updatedWardrobe || [], wishlistItems);
    } catch (err: any) {
      alert("Failed to buy product: " + (err.message || err));
    }
  };

  const handleLike = async (item: any) => {
    try {
      await addToWishlist({
        productName: item.name,
        productImage: item.imageUrl,
        brand: item.category,
        price: item.price,
        myntraUrl: `https://www.myntra.com/${encodeURIComponent(item.name)}`
      });
      alert(`"${item.name}" added to Wishlist!`);
    } catch (err) {
      alert("Failed to add to wishlist.");
    }
  };

  const categories = [
    { key: "Because It Matches Your Wardrobe", title: "Because It Matches Your Wardrobe", subtitle: "Products that complement your existing clothes." },
    { key: "Complete Your Collection", title: "Complete Your Collection", subtitle: "Essential products that fill your wardrobe gaps." },
    { key: "Trending For Your Style", title: "Trending For Your Style", subtitle: "Trending products that align with your inferred style." },
    { key: "Everyday Essentials", title: "Everyday Essentials", subtitle: "Versatile items that can be worn frequently." }
  ];

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 border-t border-border mt-12">
      <SectionHeader badge="WARDROBE-AWARE" title="Personalized Recommendations" subtitle="Custom picks calculated to optimize your wardrobe combinations." />
      
      {loading ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground animate-pulse">Loading recommendations…</div>
      ) : error ? (
        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">{error}</div>
      ) : (
        <div className="mt-8">
          {/* Style Profile banner */}
          {styleProfile && (
            <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-purple-500/5 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 justify-center md:justify-start">
                  <Sparkles className="w-4 h-4" /> Your Style Profile
                </h3>
                <p className="text-xs text-muted-foreground">Style attributes dynamically calculated from your wardrobe contents.</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="bg-white border border-border px-4 py-2.5 rounded-2xl text-center min-w-[120px]">
                  <div className="text-[9px] text-muted-foreground uppercase font-semibold">Preferred Style</div>
                  <div className="text-xs font-bold text-myntra-dark mt-1">{styleProfile.primaryStyle}</div>
                </div>
                <div className="bg-white border border-border px-4 py-2.5 rounded-2xl text-center min-w-[120px]">
                  <div className="text-[9px] text-muted-foreground uppercase font-semibold">Favorite Color</div>
                  <div className="text-xs font-bold text-myntra-dark mt-1">{styleProfile.favoriteColor}</div>
                </div>
                <div className="bg-white border border-border px-4 py-2.5 rounded-2xl text-center min-w-[120px]">
                  <div className="text-[9px] text-muted-foreground uppercase font-semibold">Fav Category</div>
                  <div className="text-xs font-bold text-myntra-dark mt-1">{styleProfile.favoriteCategory}</div>
                </div>
              </div>
            </div>
          )}

          {/* Wishlist & New Arrivals Recommendations Section */}
          <div className="mb-12 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-myntra-dark uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" /> Myntra New Arrivals & Wishlist Matches
                </h3>
                <p className="text-xs text-muted-foreground">Fresh recommendations based on your wishlist items, excluding items in your wardrobe.</p>
              </div>
              <button
                onClick={() => generatePersonalRecs(wardrobeItems, wishlistItems)}
                className="self-start sm:self-center px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5 hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate Another
              </button>
            </div>

            <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="grid grid-cols-5 gap-6 min-w-[950px]">
                {personalRecs.map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -6 }}
                    className="group rounded-3xl overflow-hidden bg-card border border-border hover:shadow-[var(--shadow-elevated)] hover:border-primary/40 transition-all flex flex-col justify-between"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black tracking-wider shadow-sm uppercase">
                        NEW ARRIVAL
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item);
                        }}
                        className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Heart className="w-4 h-4 text-[#ff3f6c] hover:fill-[#ff3f6c]" />
                      </button>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{item.category}</span>
                        <h4 className="text-sm font-bold text-myntra-dark line-clamp-1">{item.name}</h4>
                        <div className="text-xs font-black text-myntra-dark mt-1">₹{item.price}</div>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <a
                          href={getMyntraCategoryUrl(item.category)}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full block text-center py-2 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all"
                        >
                          View on Myntra
                        </a>
                        <button
                          onClick={() => handleBuy(item)}
                          className="w-full py-2 rounded-xl bg-[#ff3f6c] hover:bg-[#ff3f6c]/90 text-white text-xs font-black transition-all shadow flex items-center justify-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Buy
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {personalRecs.length === 0 && (
                  <div className="col-span-5 rounded-3xl border border-border p-8 text-center text-sm text-muted-foreground bg-card">
                    No new arrivals available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
