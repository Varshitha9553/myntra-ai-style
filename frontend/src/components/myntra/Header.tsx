import { Search, Heart, User, Sparkles, LogOut } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

const navLinks = [
  { label: "MEN", href: "https://www.myntra.com/shop/men" },
  { label: "WOMEN", href: "https://www.myntra.com/shop/women" },
  { label: "KIDS", href: "https://www.myntra.com/shop/kids" },
  { label: "HOME & LIVING", href: "https://www.myntra.com/shop/home-living" },
  { label: "BEAUTY", href: "https://www.myntra.com/shop/beauty" },
  { label: "STUDIO", href: "https://www.myntra.com/studio/home" },
  { label: "AI CLOSET", href: "/outfit-generator" },
  { label: "MY WARDROBE", href: "/closet" },
];

export function Header() {
  const navigate = useNavigate();
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("myntra_token");

  const handleLogout = () => {
    localStorage.removeItem("myntra_token");
    localStorage.removeItem("myntra_user_name");
    localStorage.removeItem("myntra_user_email");
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-6 px-4 md:px-8">
        <Link to="/" className="flex items-center gap-1 shrink-0">
          <span className="text-2xl font-black tracking-tight text-gradient-myntra">Myntra</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isAi = link.label === "AI CLOSET";
            const isWardrobe = link.label === "MY WARDROBE";
            const isExternal = link.href.startsWith("http");

            const className = `text-[13px] font-bold tracking-wide transition-colors relative group ${
              isAi || isWardrobe ? "text-primary font-black" : "text-myntra-dark hover:text-primary"
            }`;

            if (isExternal) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={className}
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
                </a>
              );
            }

            return (
              <Link
                key={link.label}
                to={link.href}
                className={className}
              >
                {isAi && <Sparkles className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
              </Link>
            );
          })}
        </nav>
        <div className="flex-1 max-w-[500px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Try 'clothes matching my blue jeans'"
            className="w-full h-11 pl-10 pr-3 rounded-md bg-secondary text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            AI
          </span>
        </div>
        <div className="flex items-center gap-5">
          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                className="flex flex-col items-center gap-0.5 text-myntra-dark hover:text-primary transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] font-bold hidden md:inline">Profile</span>
              </Link>
              <Link
                to="/wishlist"
                className="flex flex-col items-center gap-0.5 text-myntra-dark hover:text-primary transition-colors"
              >
                <Heart className="w-5 h-5" />
                <span className="text-[10px] font-bold hidden md:inline">Wishlist</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-0.5 text-myntra-dark hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[10px] font-bold hidden md:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary/5 text-xs font-bold transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-all shadow-[var(--shadow-myntra)]"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
