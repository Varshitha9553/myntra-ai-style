import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/myntra/Header";
import { DigitalCloset } from "@/components/myntra/DigitalCloset";
import { Footer } from "@/components/myntra/Footer";

export const Route = createFileRoute("/closet")({
  head: () => ({
    meta: [
      { title: "My Digital Closet · Myntra AI Closet" },
      { name: "description", content: "Manage your entire virtual wardrobe, search, filter, and upload items." },
    ],
  }),
  component: ClosetPage,
});

function ClosetPage() {
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
        <DigitalCloset showAll={true} />
      </main>
      <Footer />
    </div>
  );
}
