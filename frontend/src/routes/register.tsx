import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { registerUser } from "@/lib/api";
import { motion } from "framer-motion";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register · Myntra AI Closet" },
      { name: "description", content: "Create an account to digitize your wardrobe and get style compatibility checks." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await registerUser({ name, email, password });
      localStorage.setItem("myntra_token", response.token);
      localStorage.setItem("myntra_user_name", name);
      localStorage.setItem("myntra_user_email", email);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message || "Registration failed. Email might already be taken.");
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
          <h2 className="text-xl font-bold text-myntra-dark">Create Account</h2>
          <p className="text-xs text-muted-foreground">Sign up to digitize your virtual wardrobe today</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-myntra-dark uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

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
            <label className="text-xs font-bold text-myntra-dark uppercase tracking-wider">Password (Min 6 chars)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-myntra-dark uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm shadow-[var(--shadow-myntra)] transition-all disabled:opacity-55"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Login here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
