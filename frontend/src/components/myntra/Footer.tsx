export function Footer() {
  const cols = [
    { title: "Online Shopping", items: ["Men", "Women", "Kids", "Beauty", "Home & Living"] },
    { title: "Customer Policies", items: ["Contact Us", "FAQ", "Returns", "Shipping", "T&C"] },
    { title: "Experiences", items: ["AI Closet", "Studio", "Insider", "Gift Cards", "Site Map"] },
    { title: "Keep in Touch", items: ["Facebook", "Instagram", "Twitter", "YouTube"] },
  ];
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-xs font-black tracking-widest text-myntra-dark uppercase">{c.title}</h4>
            <ul className="mt-4 space-y-2">
              {c.items.map((i) => (
                <li key={i}><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{i}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 Myntra Designs Pvt. Ltd. · AI Closet is a Myntra WeForShe initiative.
      </div>
    </footer>
  );
}
