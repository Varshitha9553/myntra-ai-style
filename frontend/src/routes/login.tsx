import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { loginUser } from "@/lib/api";
import { motion } from "framer-motion";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login · Myntra AI Closet" },
      { name: "description", content: "Sign in to access your personal Myntra AI Closet wardrobe." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await loginUser({ email, password });
      localStorage.setItem("myntra_token", response.token);
      localStorage.setItem("myntra_user_name", response.name || "");
      localStorage.setItem("myntra_user_email", response.email || "");
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl border border-border shadow-[var(--shadow-elevated)] p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <span className="text-3xl font-black tracking-tight text-gradient-myntra">Myntra</span>
          <h2 className="text-xl font-bold text-myntra-dark">Welcome Back</h2>
          <p className="text-xs text-muted-foreground">Sign in to style your wardrobe with AI insights</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-myntra-dark uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-myntra-dark uppercase tracking-wider">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm shadow-[var(--shadow-myntra)] transition-all disabled:opacity-55"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-primary hover:underline">
            Register now
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
