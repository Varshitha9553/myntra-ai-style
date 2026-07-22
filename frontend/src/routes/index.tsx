import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/myntra/Header";
import { HeroBanner } from "@/components/myntra/HeroBanner";
import { WeatherWidget } from "@/components/myntra/WeatherWidget";
import { ShoppingAssistant } from "@/components/myntra/ShoppingAssistant";
import { Recommendations } from "@/components/myntra/Recommendations";
import { WardrobeTimeline } from "@/components/myntra/WardrobeTimeline";
import { FloatingAI } from "@/components/myntra/FloatingAI";
import { Footer } from "@/components/myntra/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Myntra AI Closet · Your Personalized Fashion Experience" },
      {
        name: "description",
        content:
          "Myntra AI Closet turns your wardrobe into a smart, style-aware assistant. Get AI outfits, duplicate alerts, missing essentials, and wardrobe insights.",
      },
      { property: "og:title", content: "Myntra AI Closet · Your Personalized Fashion Experience" },
      { property: "og:description", content: "Scan your wardrobe. Let AI style you every day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("myntra_token");
    if (!token) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <HeroBanner />
        <WeatherWidget />
        <ShoppingAssistant />
        <Recommendations />
        <WardrobeTimeline />
      </main>
      <FloatingAI />
      <Footer />
    </div>
  );
}
