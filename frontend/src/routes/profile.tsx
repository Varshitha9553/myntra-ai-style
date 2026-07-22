import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/myntra/Header";
import { Footer } from "@/components/myntra/Footer";
import { PersonalizationDashboard } from "@/components/myntra/PersonalizationDashboard";
import { getUserProfile, updateUserProfile } from "@/lib/api";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Sparkles, LogOut, Check, Heart, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile · Myntra AI Closet" },
      { name: "description", content: "Manage your personalized Myntra style profile and wardrobe stats." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit fields
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face";

  useEffect(() => {
    const token = localStorage.getItem("myntra_token");
    if (!token) {
      navigate({ to: "/login" });
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
        setName(data.name || "");
        setAvatarUrl(data.avatarUrl || "");
      } catch (err: any) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserProfile({ name, avatarUrl });
      setProfile((prev: any) => ({ ...prev, name, avatarUrl }));
      localStorage.setItem("myntra_user_name", name);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("myntra_token");
    localStorage.removeItem("myntra_user_name");
    localStorage.removeItem("myntra_user_email");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 mx-auto max-w-[1000px] px-4 md:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-myntra-dark uppercase tracking-wider">Account Profile</h1>
              <p className="text-xs text-muted-foreground">Manage your settings and review closet highlights.</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground animate-pulse">
              Loading style credentials...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Details Card */}
              <div className="md:col-span-1 bg-white border border-border rounded-3xl p-6 flex flex-col items-center justify-between text-center space-y-6">
                <div className="space-y-4 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border border-border bg-secondary shadow-inner relative group">
                    <img
                      src={avatarUrl || defaultAvatar}
                      alt={profile?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-myntra-dark">{profile?.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {profile?.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center mt-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" /> Joined: {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Wardrobe Metrics */}
                <div className="w-full grid grid-cols-2 gap-3 pt-6 border-t border-border">
                  <div className="bg-secondary/40 p-3 rounded-2xl">
                    <div className="text-[9px] text-muted-foreground uppercase font-semibold">Wardrobe</div>
                    <div className="text-lg font-black text-myntra-dark mt-1">{profile?.wardrobeCount || 0}</div>
                    <span className="text-[9px] text-muted-foreground">Items</span>
                  </div>
                  <div className="bg-secondary/40 p-3 rounded-2xl">
                    <div className="text-[9px] text-muted-foreground uppercase font-semibold">Wishlist</div>
                    <div className="text-lg font-black text-myntra-dark mt-1">{profile?.wishlistCount || 0}</div>
                    <span className="text-[9px] text-muted-foreground">Liked</span>
                  </div>
                </div>
              </div>

              {/* Edit Profile Form */}
              <div className="md:col-span-2 bg-white border border-border rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-myntra-dark uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" /> Profile Settings
                  </h3>
                  <p className="text-xs text-muted-foreground">Modify your public representation on your AI closet.</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 text-center">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 text-center flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> {success}
                  </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-myntra-dark uppercase tracking-wider">Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter new name"
                      className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-myntra-dark uppercase tracking-wider">Avatar Image URL</label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground">Enter an Unsplash or external direct link to change your display picture.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-55"
                  >
                    {saving ? "Saving changes..." : "Save Profile Settings"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {!loading && <PersonalizationDashboard />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
