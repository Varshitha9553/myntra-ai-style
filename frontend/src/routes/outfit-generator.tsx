import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/myntra/Header";
import { OutfitGenerator } from "@/components/myntra/OutfitGenerator";
import { Footer } from "@/components/myntra/Footer";

export const Route = createFileRoute("/outfit-generator")({
  head: () => ({
    meta: [
      { title: "AI Outfit Generator · Myntra AI Closet" },
      { name: "description", content: "Generate personalized outfit combinations dynamically styled by AI." },
    ],
  }),
  component: OutfitGeneratorPage,
});

function OutfitGeneratorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("myntra_token");
    if (!token) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      <main className="pt-20">
        <OutfitGenerator />
      </main>
      <Footer />
    </div>
  );
}
