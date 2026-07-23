import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CloudRain, Sun, Cloud, CloudSnow, HelpCircle, 
  User, Check, Trash2, RefreshCw, Sparkles, Upload, 
  ChevronRight, ChevronLeft, Calendar, Info, Layers,
  AlertTriangle
} from "lucide-react";
import { getWardrobeItems, resolveImageUrl } from "@/lib/api";

interface ClosetItem {
  id: string | number;
  name: string;
  category: string;
  color: string;
  imageUrl?: string;
  occasion?: string;
  season?: string;
}

interface PlannedDay {
  dayName: string;
  dateStr: string;
  temp: number;
  condition: string;
  weatherCode: number;
  recommendation: string;
  outfit: {
    top?: ClosetItem;
    bottom?: ClosetItem;
    footwear?: ClosetItem;
    outerwear?: ClosetItem;
    accessory?: ClosetItem;
  } | null;
}

const WMO_WEATHER: Record<number, { emoji: string; text: string; categoryRecommendation: string }> = {
  0: { emoji: "☀️", text: "Sunny / Clear", categoryRecommendation: "Light cotton topwear & bottomwear. Sunglasses recommended." },
  1: { emoji: "🌤️", text: "Mainly Clear", categoryRecommendation: "Comfortable topwear with jeans or trousers." },
  2: { emoji: "⛅", text: "Partly Cloudy", categoryRecommendation: "Versatile styling. Carry a light layer just in case." },
  3: { emoji: "☁️", text: "Overcast", categoryRecommendation: "Hoodie, sweatshirt, or light outerwear recommended." },
  45: { emoji: "🌫️", text: "Foggy", categoryRecommendation: "Cozy outerwear to keep comfortable in fog." },
  48: { emoji: "🌫️", text: "Depositing Rime Fog", categoryRecommendation: "Warm layering and protective footwear." },
  51: { emoji: "🌧️", text: "Light Drizzle", categoryRecommendation: "Water-resistant outerwear or windbreaker & sports shoes." },
  53: { emoji: "🌧️", text: "Moderate Drizzle", categoryRecommendation: "Windbreaker or shrug, water-resistant footwear." },
  55: { emoji: "🌧️", text: "Heavy Drizzle", categoryRecommendation: "Waterproof jackets and boots." },
  61: { emoji: "🌧️", text: "Light Rain", categoryRecommendation: "Water-resistant outerwear, sturdy footwear, carry umbrella." },
  63: { emoji: "🌧️", text: "Moderate Rain", categoryRecommendation: "Waterproof outer layers, rain boots or sneakers." },
  65: { emoji: "🌧️", text: "Heavy Rain", categoryRecommendation: "Full waterproof shell and non-slip footwear." },
  71: { emoji: "❄️", text: "Light Snow", categoryRecommendation: "Heavy knit sweaters, heavy outerwear, warm boots." },
  73: { emoji: "❄️", text: "Moderate Snow", categoryRecommendation: "Insulated winter jackets, scarves, thick footwear." },
  75: { emoji: "❄️", text: "Heavy Snow", categoryRecommendation: "Heavy winter coats, thermal layers, snow gear." },
  80: { emoji: "🌧️", text: "Light Rain Showers", categoryRecommendation: "Waterproof jacket and comfortable shoes." },
  81: { emoji: "🌧️", text: "Moderate Rain Showers", categoryRecommendation: "Heavy layers, waterproof outerwear." },
  82: { emoji: "🌧️", text: "Violent Rain Showers", categoryRecommendation: "Heavy duty raincoat and rain footwear." },
  95: { emoji: "⛈️", text: "Thunderstorm", categoryRecommendation: "Stay indoors. Warm casual indoor layers." },
  96: { emoji: "⛈️", text: "Thunderstorm with Hail", categoryRecommendation: "Stay indoors. Heavy fleece sweatshirt or knitwear." },
  99: { emoji: "⛈️", text: "Heavy Thunderstorm", categoryRecommendation: "Stay indoors. Thick comfortable loungewear." }
};

const getCategoryFallbackImage = (category: string) => {
  const cat = category.toLowerCase().trim();
  if (cat.includes("topwear") || cat.includes("shirt") || cat.includes("tee")) {
    return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80"; // white t-shirt fallback
  }
  if (cat.includes("bottomwear") || cat.includes("pant") || cat.includes("jeans") || cat.includes("chino")) {
    return "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80"; // blue jeans fallback
  }
  if (cat.includes("footwear") || cat.includes("shoe") || cat.includes("sneaker") || cat.includes("boot")) {
    return "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80"; // shoes fallback
  }
  if (cat.includes("outerwear") || cat.includes("jacket") || cat.includes("coat")) {
    return "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80"; // leather jacket fallback
  }
  if (cat.includes("accessories") || cat.includes("accessory") || cat.includes("watch") || cat.includes("belt") || cat.includes("bag")) {
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"; // watch fallback
  }
  return "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80";
};

const AVATAR_IMAGES = {
  male: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80",
  female: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80",
  neutral: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&q=80"
};

export function StylePlanner() {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [loadingCloset, setLoadingCloset] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("Topwear");

  // Avatar Try-on Slots
  const [selectedTop, setSelectedTop] = useState<ClosetItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<ClosetItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<ClosetItem | null>(null);
  const [selectedOuter, setSelectedOuter] = useState<ClosetItem | null>(null);
  const [selectedAccessory, setSelectedAccessory] = useState<ClosetItem | null>(null);

  // Avatar Settings (male defaults active)
  const [avatarType, setAvatarType] = useState<"female" | "male" | "neutral">("male");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  // 7-day style calendar
  const [plannerDays, setPlannerDays] = useState<PlannedDay[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>("Monday");

  // Load Closet Items
  const loadCloset = async () => {
    try {
      setLoadingCloset(true);
      const res = await getWardrobeItems({ page: 1, limit: 100 });
      if (res && res.items) {
        setClosetItems(res.items);
      }
    } catch (err) {
      console.error("Failed to load closet items for style planner:", err);
    } finally {
      setLoadingCloset(false);
    }
  };

  // Fetch 7-day weather and build calendar
  const loadWeatherPlanner = async () => {
    try {
      setLoadingWeather(true);
      let lat = 12.9716;
      let lon = 77.5946;

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchForecast(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            fetchForecast(lat, lon);
          }
        );
      } else {
        fetchForecast(lat, lon);
      }
    } catch (err) {
      console.error("Weather load error:", err);
      setLoadingWeather(false);
    }
  };

  const fetchForecast = async (latitude: number, longitude: number) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const response = await fetch(url);
      const data = await response.json();

      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const daily = data.daily;
      const todayIdx = new Date().getDay();

      const itemsFromSession = sessionStorage.getItem("planned_weekly_style");
      const savedWeeklyOutfits = itemsFromSession ? JSON.parse(itemsFromSession) : {};

      const builtDays: PlannedDay[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dayName = daysOfWeek[date.getDay()];
        const weatherCode = daily.weathercode[i] ?? 0;
        const maxTemp = Math.round(daily.temperature_2m_max[i] ?? 25);
        const weatherInfo = WMO_WEATHER[weatherCode] || { emoji: "☀️", text: "Sunny", categoryRecommendation: "Casual tops and bottomwear" };
        
        builtDays.push({
          dayName,
          dateStr: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          temp: maxTemp,
          condition: weatherInfo.text,
          weatherCode,
          recommendation: weatherInfo.categoryRecommendation,
          outfit: savedWeeklyOutfits[dayName] || null
        });
      }
      setPlannerDays(builtDays);
    } catch (err) {
      console.error("Forecast fetch failed:", err);
      const fallbackDays: PlannedDay[] = [];
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      days.forEach((day, idx) => {
        fallbackDays.push({
          dayName: day,
          dateStr: `July ${22 + idx}`,
          temp: 26,
          condition: "Sunny / Clear",
          weatherCode: 0,
          recommendation: "Light cotton topwear & bottomwear. Sunglasses recommended.",
          outfit: null
        });
      });
      setPlannerDays(fallbackDays);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadCloset();
    loadWeatherPlanner();
  }, []);

  const saveWeeklyOutfit = (day: string, outfit: PlannedDay["outfit"]) => {
    const updatedDays = plannerDays.map(d => {
      if (d.dayName === day) {
        return { ...d, outfit };
      }
      return d;
    });
    setPlannerDays(updatedDays);

    const savedWeeklyOutfits = updatedDays.reduce((acc, curr) => {
      if (curr.outfit) {
        acc[curr.dayName] = curr.outfit;
      }
      return acc;
    }, {} as Record<string, any>);

    sessionStorage.setItem("planned_weekly_style", JSON.stringify(savedWeeklyOutfits));
  };

  const handleFixOutfit = () => {
    const currentOutfit = {
      top: selectedTop || undefined,
      bottom: selectedBottom || undefined,
      footwear: selectedShoes || undefined,
      outerwear: selectedOuter || undefined,
      accessory: selectedAccessory || undefined
    };
    
    if (!selectedTop && !selectedBottom && !selectedShoes && !selectedOuter && !selectedAccessory) {
      alert("Please select at least one clothing item on the avatar to assign!");
      return;
    }

    saveWeeklyOutfit(selectedCalendarDay, currentOutfit);
    alert(`Outfit fixed successfully for ${selectedCalendarDay}!`);
  };

  const handleReviseAvatar = () => {
    const filteredTops = closetItems.filter(i => i.category === "Topwear");
    const filteredBottoms = closetItems.filter(i => i.category === "Bottomwear");
    const filteredShoes = closetItems.filter(i => i.category === "Footwear");
    const filteredOuter = closetItems.filter(i => i.category === "Outerwear");
    const filteredAccessory = closetItems.filter(i => i.category === "Accessories");

    if (filteredTops.length > 0) setSelectedTop(filteredTops[Math.floor(Math.random() * filteredTops.length)]);
    if (filteredBottoms.length > 0) setSelectedBottom(filteredBottoms[Math.floor(Math.random() * filteredBottoms.length)]);
    if (filteredShoes.length > 0) setSelectedShoes(filteredShoes[Math.floor(Math.random() * filteredShoes.length)]);
    if (filteredOuter.length > 0 && Math.random() > 0.5) {
      setSelectedOuter(filteredOuter[Math.floor(Math.random() * filteredOuter.length)]);
    } else {
      setSelectedOuter(null);
    }
    if (filteredAccessory.length > 0 && Math.random() > 0.5) {
      setSelectedAccessory(filteredAccessory[Math.floor(Math.random() * filteredAccessory.length)]);
    } else {
      setSelectedAccessory(null);
    }
  };

  const handleClearAvatar = () => {
    setSelectedTop(null);
    setSelectedBottom(null);
    setSelectedShoes(null);
    setSelectedOuter(null);
    setSelectedAccessory(null);
  };

  const handleLoadDayOutfit = (day: PlannedDay) => {
    setSelectedCalendarDay(day.dayName);
    if (day.outfit) {
      setSelectedTop(day.outfit.top || null);
      setSelectedBottom(day.outfit.bottom || null);
      setSelectedShoes(day.outfit.footwear || null);
      setSelectedOuter(day.outfit.outerwear || null);
      setSelectedAccessory(day.outfit.accessory || null);
    } else {
      handleClearAvatar();
    }
  };

  const handleAutoProposeLook = (day: PlannedDay) => {
    const dayCode = day.weatherCode;
    const isCold = day.temp < 20;
    const isWet = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(dayCode);

    const filteredTops = closetItems.filter(i => i.category === "Topwear");
    const filteredBottoms = closetItems.filter(i => i.category === "Bottomwear");
    const filteredShoes = closetItems.filter(i => i.category === "Footwear");
    const filteredOuter = closetItems.filter(i => i.category === "Outerwear");
    const filteredAccessory = closetItems.filter(i => i.category === "Accessories");

    let proposedTop = filteredTops[Math.floor(Math.random() * filteredTops.length)] || null;
    let proposedBottom = filteredBottoms[Math.floor(Math.random() * filteredBottoms.length)] || null;
    let proposedShoes = filteredShoes[Math.floor(Math.random() * filteredShoes.length)] || null;
    let proposedOuter = null;
    let proposedAccessory = filteredAccessory[Math.floor(Math.random() * filteredAccessory.length)] || null;

    if (isCold && filteredOuter.length > 0) {
      proposedOuter = filteredOuter[Math.floor(Math.random() * filteredOuter.length)];
    }
    if (isWet && filteredOuter.length > 0) {
      proposedOuter = filteredOuter.find(i => i.name.toLowerCase().includes("jacket") || i.name.toLowerCase().includes("coat")) || filteredOuter[0];
    }

    const proposed = {
      top: proposedTop || undefined,
      bottom: proposedBottom || undefined,
      footwear: proposedShoes || undefined,
      outerwear: proposedOuter || undefined,
      accessory: proposedAccessory || undefined
    };

    saveWeeklyOutfit(day.dayName, proposed);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollCategoryList = (direction: 'left' | 'right') => {
    const container = document.getElementById("closet-carousel-container");
    if (container) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const detectColor = (item: ClosetItem | null) => {
    if (!item) return "";
    const name = (item.name || "").toLowerCase();
    const color = (item.color || "").toLowerCase();
    
    if (name.includes("blue") || color.includes("blue")) return "blue";
    if (name.includes("red") || color.includes("red")) return "red";
    if (name.includes("green") || name.includes("olive") || color.includes("green") || color.includes("olive")) return "green";
    if (name.includes("black") || color.includes("black")) return "black";
    if (name.includes("white") || color.includes("white")) return "white";
    
    return color || name;
  };

  const getCompatibilityScore = () => {
    if (!selectedTop && !selectedBottom && !selectedShoes) return 0;
    
    let score = 50; // base score for choosing items
    
    const day = plannerDays.find(d => d.dayName === selectedCalendarDay);
    if (!day) return score;
    
    const dayCode = day.weatherCode;
    const isWet = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(dayCode);
    const isCold = day.temp < 20;
    
    // 1. Complete outfit bonus
    if (selectedTop && selectedBottom && selectedShoes) {
      score += 20;
    }
    
    // 2. Accessories bonus
    if (selectedAccessory) {
      score += 10;
    }
    
    // 3. Weather matching check
    if (isWet) {
      if (selectedOuter) score += 10;
      if (selectedShoes && (selectedShoes.name.toLowerCase().includes("shoe") || selectedShoes.name.toLowerCase().includes("sneaker") || selectedShoes.name.toLowerCase().includes("boot"))) {
        score += 5;
      }
    } else if (isCold) {
      if (selectedOuter) score += 10;
    } else {
      if (!selectedOuter) score += 5;
    }
    
    // 4. Color matching rules
    const topCol = detectColor(selectedTop);
    const botCol = detectColor(selectedBottom);
    
    if (topCol && botCol) {
      if (topCol === botCol) {
        score += 5;
      } else if (
        (topCol === "black" && botCol === "blue") ||
        (topCol === "white" && botCol === "blue") ||
        (topCol === "red" && botCol === "black") ||
        (topCol === "blue" && botCol === "black")
      ) {
        score += 10;
      }
    }
    
    return Math.min(100, score);
  };

  const getWeatherAdvisory = () => {
    const day = plannerDays.find(d => d.dayName === selectedCalendarDay);
    if (!day) return [];
    
    const temp = day.temp;
    const weatherCode = day.weatherCode;
    const isWet = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode);
    const isCold = temp < 18;
    
    const alerts: string[] = [];

    // 1. Hot temperature warnings
    if (temp >= 28) {
      if (selectedOuter) {
        alerts.push(`It's ${temp}°C & Sunny on ${day.dayName}. You might feel too warm wearing Outerwear like "${selectedOuter.name}"!`);
      }
    }

    // 2. Wet weather warnings
    if (isWet) {
      if (selectedShoes && !(selectedShoes.name.toLowerCase().includes("sport") || selectedShoes.name.toLowerCase().includes("boot") || selectedShoes.name.toLowerCase().includes("sneaker") || selectedShoes.name.toLowerCase().includes("running"))) {
        alerts.push(`Rain is predicted on ${day.dayName}. Avoid delicate footwear like "${selectedShoes.name}" to prevent water damage.`);
      }
      if (!selectedOuter) {
        alerts.push(`Rain forecast on ${day.dayName}. Consider wearing a water-resistant windbreaker or jacket.`);
      }
    }

    // 3. Cold weather warnings
    if (isCold) {
      if (!selectedOuter) {
        alerts.push(`It's chilly (${temp}°C) on ${day.dayName}. Adding a warm jacket, coat, or layer is recommended.`);
      }
    }

    return alerts;
  };

  const filteredItems = closetItems.filter(i => i.category === activeCategory);
  const showCarousel = filteredItems.length > 5;

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
            <Calendar className="w-3.5 h-3.5" /> STYLE LABORATORY
          </div>
          <h2 className="text-3xl font-black text-myntra-dark leading-none">Weekly Weather Planner </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Match coordinates visually on a Try-on Avatar and align your weekly looks with 7-day local weather forecasts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadWeatherPlanner}
            disabled={loadingWeather}
            className="px-4 py-2 bg-secondary text-myntra-dark hover:bg-secondary/80 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? 'animate-spin' : ''}`} /> Refresh Weather
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: 2D Try-on Avatar (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden p-6 flex flex-col">
            <h3 className="text-sm font-black text-myntra-dark uppercase tracking-wider mb-4 border-l-2 border-primary pl-2">
              👗 2D Mix-&-Match Dressing Room
            </h3>

            {/* Avatar Try-on Visual Container */}
            <div className="relative aspect-[3/4.2] w-full rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center p-4 shadow-inner">
              
              {/* Photo backdrop model image (only shown if customPhoto is uploaded) */}
              {customPhoto && (
                <img 
                  src={customPhoto} 
                  alt="Avatar Backdrop" 
                  className="absolute inset-0 w-full h-full object-cover transition-all opacity-60" 
                />
              )}

              {/* Reverted 2D SVG silhouette shape drawing backdrop */}
              {!customPhoto && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <svg className="w-4/5 h-4/5 text-slate-400" viewBox="0 0 100 200" fill="currentColor">
                    {avatarType === "female" ? (
                      <path d="M50,15 A6,6 0 1,0 50,27 A6,6 0 1,0 50,15 M43,30 L57,30 L54,65 L57,110 L54,190 L46,190 L43,110 L46,65 Z" />
                    ) : avatarType === "male" ? (
                      <path d="M50,12 A7,7 0 1,0 50,26 A7,7 0 1,0 50,12 M40,28 L60,28 L56,65 L58,110 L55,190 L45,190 L42,110 L44,65 Z" />
                    ) : (
                      <path d="M50,13 A6.5,6.5 0 1,0 50,26 A6.5,6.5 0 1,0 50,13 M41.5,29 L58.5,29 L55,65 L57.5,110 L54.5,190 L45.5,190 L42.5,110 L45,65 Z" />
                    )}
                  </svg>
                </div>
              )}

              {/* Try-on Layer Items absolute overlays with fallback resolution */}
              <div className="relative w-full h-full flex flex-col justify-between items-center z-10 py-4 pointer-events-none">
                
                {/* 1. Outerwear Layer */}
                <div className="h-[18%] w-full flex items-center justify-center relative">
                  <AnimatePresence>
                    {selectedOuter && (
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                        className="w-[120px] h-[95%] rounded-2xl border border-border bg-white shadow-md p-1.5 pointer-events-auto cursor-pointer flex flex-col items-center justify-between relative"
                        onClick={() => setSelectedOuter(null)}
                        title="Remove Outerwear"
                      >
                        <div className="flex-1 w-full rounded-xl overflow-hidden bg-secondary relative min-h-0">
                          <img 
                            src={selectedOuter.imageUrl ? resolveImageUrl(selectedOuter.imageUrl) : getCategoryFallbackImage(selectedOuter.category)} 
                            alt={selectedOuter.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-primary/95 text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none uppercase">Outerwear</div>
                        <div className="w-full min-w-0 text-center pt-1 shrink-0">
                          <p className="text-[8.5px] font-black text-myntra-dark truncate leading-tight px-0.5" title={selectedOuter.name}>{selectedOuter.name}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Accessories Layer */}
                <div className="h-[18%] w-full flex items-center justify-center relative">
                  <AnimatePresence>
                    {selectedAccessory && (
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                        className="w-[120px] h-[95%] rounded-2xl border border-border bg-white shadow-md p-1.5 pointer-events-auto cursor-pointer flex flex-col items-center justify-between relative"
                        onClick={() => setSelectedAccessory(null)}
                        title="Remove Accessory"
                      >
                        <div className="flex-1 w-full rounded-xl overflow-hidden bg-secondary relative min-h-0">
                          <img 
                            src={selectedAccessory.imageUrl ? resolveImageUrl(selectedAccessory.imageUrl) : getCategoryFallbackImage(selectedAccessory.category)} 
                            alt={selectedAccessory.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-primary/95 text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none uppercase">Accessory</div>
                        <div className="w-full min-w-0 text-center pt-1 shrink-0">
                          <p className="text-[8.5px] font-black text-myntra-dark truncate leading-tight px-0.5" title={selectedAccessory.name}>{selectedAccessory.name}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Topwear Layer */}
                <div className="h-[22%] w-full flex items-center justify-center relative">
                  <AnimatePresence>
                    {selectedTop && (
                      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                        className="w-[120px] h-[95%] rounded-2xl border border-border bg-white shadow-md p-1.5 pointer-events-auto cursor-pointer flex flex-col items-center justify-between relative"
                        onClick={() => setSelectedTop(null)}
                        title="Remove Topwear"
                      >
                        <div className="flex-1 w-full rounded-xl overflow-hidden bg-secondary relative min-h-0">
                          <img 
                            src={selectedTop.imageUrl ? resolveImageUrl(selectedTop.imageUrl) : getCategoryFallbackImage(selectedTop.category)} 
                            alt={selectedTop.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-primary/95 text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none uppercase">Topwear</div>
                        <div className="w-full min-w-0 text-center pt-1 shrink-0">
                          <p className="text-[8.5px] font-black text-myntra-dark truncate leading-tight px-0.5" title={selectedTop.name}>{selectedTop.name}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. Bottomwear Layer */}
                <div className="h-[22%] w-full flex items-center justify-center relative">
                  <AnimatePresence>
                    {selectedBottom && (
                      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
                        className="w-[120px] h-[95%] rounded-2xl border border-border bg-white shadow-md p-1.5 pointer-events-auto cursor-pointer flex flex-col items-center justify-between relative"
                        onClick={() => setSelectedBottom(null)}
                        title="Remove Bottomwear"
                      >
                        <div className="flex-1 w-full rounded-xl overflow-hidden bg-secondary relative min-h-0">
                          <img 
                            src={selectedBottom.imageUrl ? resolveImageUrl(selectedBottom.imageUrl) : getCategoryFallbackImage(selectedBottom.category)} 
                            alt={selectedBottom.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-primary/95 text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none uppercase">Bottomwear</div>
                        <div className="w-full min-w-0 text-center pt-1 shrink-0">
                          <p className="text-[8.5px] font-black text-myntra-dark truncate leading-tight px-0.5" title={selectedBottom.name}>{selectedBottom.name}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 5. Footwear Layer */}
                <div className="h-[18%] w-full flex items-center justify-center relative">
                  <AnimatePresence>
                    {selectedShoes && (
                      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                        className="w-[120px] h-[95%] rounded-2xl border border-border bg-white shadow-md p-1.5 pointer-events-auto cursor-pointer flex flex-col items-center justify-between relative"
                        onClick={() => setSelectedShoes(null)}
                        title="Remove Footwear"
                      >
                        <div className="flex-1 w-full rounded-xl overflow-hidden bg-secondary relative min-h-0">
                          <img 
                            src={selectedShoes.imageUrl ? resolveImageUrl(selectedShoes.imageUrl) : getCategoryFallbackImage(selectedShoes.category)} 
                            alt={selectedShoes.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-primary/95 text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none uppercase">Footwear</div>
                        <div className="w-full min-w-0 text-center pt-1 shrink-0">
                          <p className="text-[8.5px] font-black text-myntra-dark truncate leading-tight px-0.5" title={selectedShoes.name}>{selectedShoes.name}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Complete Look Try-on Summary feedback */}
            {selectedTop && selectedBottom && selectedShoes && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-myntra-dark space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> WORN STYLE OUTLINE:
                  </div>
                  <div className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
                    Weather Match: {getCompatibilityScore()}%
                  </div>
                </div>
                <p className="leading-snug text-slate-700">
                  A matching coordinate combining your <strong>{selectedTop.name}</strong>, <strong>{selectedBottom.name}</strong>, and <strong>{selectedShoes.name}</strong>
                  {selectedOuter ? `, styled with ${selectedOuter.name}` : ''}
                  {selectedAccessory ? `, complemented by ${selectedAccessory.name}` : ''}.
                </p>
                <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    style={{ width: `${getCompatibilityScore()}%` }} 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  />
                </div>
                <div className="text-[10px] text-muted-foreground italic mt-0.5">
                  🎨 Coordination Style: {selectedTop.color.toLowerCase() === selectedBottom.color.toLowerCase() ? 'Monochromatic matching look!' : 'Balanced contrast look!'}
                </div>
              </div>
            )}

            {/* Smart Style & Weather Layer Advisor Banner warnings */}
            {(selectedTop || selectedBottom || selectedShoes || selectedOuter) && getWeatherAdvisory().length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2"
              >
                <div className="font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Weather Style Advisor
                </div>
                <ul className="space-y-1.5 text-slate-700 pl-1 list-disc list-inside">
                  {getWeatherAdvisory().map((alertText, index) => (
                    <li key={index} className="leading-snug">
                      {alertText}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Avatar Select controls */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button 
                onClick={() => { setAvatarType("male"); setCustomPhoto(null); }}
                className={`py-1.5 text-[10px] font-bold rounded-lg border ${avatarType === "male" && !customPhoto ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
              >
                Male 2D
              </button>
              <button 
                onClick={() => { setAvatarType("female"); setCustomPhoto(null); }}
                className={`py-1.5 text-[10px] font-bold rounded-lg border ${avatarType === "female" && !customPhoto ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
              >
                Female 2D
              </button>
              <label className="py-1.5 text-[10px] font-bold rounded-lg border border-border text-muted-foreground flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-50">
                <Upload className="w-3.5 h-3.5" /> Custom
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            {/* Revision & Reset actions */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button 
                onClick={handleReviseAvatar}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-myntra-dark text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Revise Look
              </button>
              <button 
                onClick={handleClearAvatar}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-myntra-dark text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" /> Clear Body
              </button>
            </div>

            {/* Fix combination to calendar */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-myntra-dark uppercase tracking-wider">Fix to Calendar Day:</span>
                <select 
                  value={selectedCalendarDay}
                  onChange={(e) => setSelectedCalendarDay(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <button
                onClick={handleFixOutfit}
                className="w-full py-3 bg-[#ff3f6c] hover:bg-[#ff3f6c]/90 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save combination for {selectedCalendarDay}
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: 7-Day Style Calendar & Weather Board (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Weather Indicator Banner */}
          <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-teal-50/30 p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <h3 className="text-base font-black text-myntra-dark flex items-center gap-1.5">
                📅 7-Day Weather & Style Forecast
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Click any day below to load its coordinates onto the try-on avatar, clear its assigned look, or trigger AI style proposals.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-white/70 px-3 py-1.5 rounded-full border border-border">
              <Layers className="w-3.5 h-3.5 text-primary" /> Drag / Drop outfits to customize
            </div>
          </div>

          {/* 7-Day Board Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {loadingWeather ? (
              <div className="col-span-7 py-20 text-center text-sm text-muted-foreground animate-pulse border border-dashed border-border rounded-3xl">
                Loading weekly weather planner forecast...
              </div>
            ) : (
              plannerDays.map((day) => (
                <div
                  key={day.dayName}
                  onClick={() => handleLoadDayOutfit(day)}
                  className={`rounded-2xl border p-4 transition-all flex flex-col justify-between cursor-pointer group ${
                    selectedCalendarDay === day.dayName
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "border-border bg-card hover:bg-secondary/40"
                  }`}
                >
                  {/* Weather Info */}
                  <div className="text-center pb-3 border-b border-border/50">
                    <span className="text-[9px] font-black text-myntra-dark uppercase tracking-wider block">{day.dayName.slice(0, 3)}</span>
                    <span className="text-[8px] text-muted-foreground block mt-0.5">{day.dateStr}</span>
                    <span className="text-2xl block my-2">{WMO_WEATHER[day.weatherCode]?.emoji || "☀️"}</span>
                    <span className="text-xs font-black text-myntra-dark block">{day.temp}°C</span>
                    <span className="text-[8px] text-muted-foreground block truncate mt-0.5" title={day.condition}>{day.condition}</span>
                  </div>

                  {/* Day's Assigned Outfit Preview */}
                  <div className="py-4 flex-1 flex flex-col items-center justify-center">
                    {day.outfit ? (
                      <div className="relative grid grid-cols-2 gap-1 w-full max-w-[80px] aspect-square rounded-xl bg-slate-50 border border-slate-200 p-1">
                        {day.outfit.top && (
                          <div className="rounded overflow-hidden bg-white border border-slate-100">
                            <img 
                              src={day.outfit.top.imageUrl ? resolveImageUrl(day.outfit.top.imageUrl) : getCategoryFallbackImage(day.outfit.top.category)} 
                              alt="Top" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        {day.outfit.bottom && (
                          <div className="rounded overflow-hidden bg-white border border-slate-100">
                            <img 
                              src={day.outfit.bottom.imageUrl ? resolveImageUrl(day.outfit.bottom.imageUrl) : getCategoryFallbackImage(day.outfit.bottom.category)} 
                              alt="Bottom" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        {day.outfit.footwear && (
                          <div className="rounded overflow-hidden bg-white border border-slate-100 col-span-2 aspect-[2/1]">
                            <img 
                              src={day.outfit.footwear.imageUrl ? resolveImageUrl(day.outfit.footwear.imageUrl) : getCategoryFallbackImage(day.outfit.footwear.category)} 
                              alt="Shoes" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/40 group-hover:scale-105 transition-transform">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Day-specific Actions */}
                  <div className="flex flex-col gap-1.5 pt-3 border-t border-border/50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoProposeLook(day);
                      }}
                      className="w-full py-1 text-[8px] font-black uppercase text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition"
                      title="Auto propose layout match based on weather code"
                    >
                      AI Propose
                    </button>
                    {day.outfit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveWeeklyOutfit(day.dayName, null);
                        }}
                        className="w-full py-1 text-[8px] font-black uppercase text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Calendar Day Details & Wardrobe Browser Drawer */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-6">
            
            {/* Header: Selected day forecast recommendation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-secondary/20 p-4 rounded-2xl">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-wider">Planning day: {selectedCalendarDay}</span>
                <h4 className="text-base font-black text-myntra-dark mt-1 flex items-center gap-1.5">
                  {plannerDays.find(d => d.dayName === selectedCalendarDay)?.dayName} Forecast Recommendation
                </h4>
              </div>
              <div className="text-xs font-semibold text-myntra-dark bg-white border border-border px-3 py-1.5 rounded-xl shadow-xs">
                💡 {plannerDays.find(d => d.dayName === selectedCalendarDay)?.recommendation}
              </div>
            </div>

            {/* Wardrobe Items Browser Drawer */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-black text-myntra-dark uppercase tracking-wider">Select Clothing to Try On</span>
                
                {/* Category filters */}
                <div className="flex gap-1.5">
                  {["Topwear", "Bottomwear", "Footwear", "Outerwear", "Accessories"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                        activeCategory === cat
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items grid / carousel wrapper */}
              {loadingCloset ? (
                <div className="py-10 text-center text-xs text-muted-foreground animate-pulse">
                  Loading your closet items...
                </div>
              ) : (
                <div className="relative">
                  {showCarousel && (
                    <div className="absolute right-0 -top-11 flex gap-1 z-10">
                      <button
                        onClick={() => scrollCategoryList('left')}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-myntra-dark transition active:scale-95 shadow-sm border border-border"
                        title="Scroll Left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => scrollCategoryList('right')}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-myntra-dark transition active:scale-95 shadow-sm border border-border"
                        title="Scroll Right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div
                    id="closet-carousel-container"
                    className={`pb-4 scroll-smooth ${
                      showCarousel
                        ? "flex overflow-x-auto gap-4 scrollbar-thin snap-x scroll-padding"
                        : "grid grid-cols-2 sm:grid-cols-5 gap-4"
                    }`}
                  >
                    {filteredItems.map((item) => {
                      const isSelected = 
                        selectedTop?.id === item.id || 
                        selectedBottom?.id === item.id || 
                        selectedShoes?.id === item.id || 
                        selectedOuter?.id === item.id ||
                        selectedAccessory?.id === item.id;

                      const itemImg = item.imageUrl ? resolveImageUrl(item.imageUrl) : getCategoryFallbackImage(item.category);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (activeCategory === "Topwear") setSelectedTop(isSelected ? null : item);
                            if (activeCategory === "Bottomwear") setSelectedBottom(isSelected ? null : item);
                            if (activeCategory === "Footwear") setSelectedShoes(isSelected ? null : item);
                            if (activeCategory === "Outerwear") setSelectedOuter(isSelected ? null : item);
                            if (activeCategory === "Accessories") setSelectedAccessory(isSelected ? null : item);
                          }}
                          className={`group rounded-xl overflow-hidden border p-2 flex flex-col justify-between text-left cursor-pointer transition-all ${
                            showCarousel ? "w-[160px] shrink-0 snap-start" : ""
                          } ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                              : "border-border bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="aspect-square bg-secondary rounded-lg overflow-hidden relative">
                            <img src={itemImg} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div className="mt-2 min-w-0">
                            <p className="text-[10px] font-black text-myntra-dark truncate leading-snug">{item.name}</p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold mt-0.5">{item.color} · {item.occasion || 'Casual'}</p>
                          </div>
                        </div>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <div className="col-span-5 w-full py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                        No {activeCategory} items found. Go to the Digital Closet page to upload some!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
