import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/myntra/Header";
import { TravelPacking } from "@/components/myntra/TravelPacking";
import { Footer } from "@/components/myntra/Footer";

export const Route = createFileRoute("/travel-packing")({
  head: () => ({
    meta: [
      { title: "Smart Travel Packing · Myntra AI Closet" },
      { name: "description", content: "Plan lighter and style smarter. Curate a cohesive capsule wardrobe for your trip." },
    ],
  }),
  component: TravelPackingPage,
});

function TravelPackingPage() {
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
        <TravelPacking />
      </main>
      <Footer />
    </div>
  );
}
