import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/myntra/Header";
import { StylePlanner } from "@/components/myntra/StylePlanner";
import { Footer } from "@/components/myntra/Footer";

export const Route = createFileRoute("/style-planner")({
  head: () => ({
    meta: [
      { title: "Weekly Weather Style Planner & Try-On | Myntra AI Closet" },
      { name: "description", content: "Plan your weekly outfits and try them on a 2D fashion avatar based on weather forecasts." },
    ],
  }),
  component: StylePlannerPage,
});

function StylePlannerPage() {
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
        <StylePlanner />
      </main>
      <Footer />
    </div>
  );
}
