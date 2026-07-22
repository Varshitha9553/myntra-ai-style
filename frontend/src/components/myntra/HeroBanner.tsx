import { motion } from "framer-motion";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://www.myntra.com"
            target="_blank"
            rel="noreferrer"
            className="md:col-span-2 block"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden relative h-[280px] md:h-[420px] group cursor-pointer"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.92 0.08 20) 0%, oklch(0.85 0.14 30) 100%)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80"
                alt="Winter Wardrobe Sale"
                className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/50 to-transparent">
                <p className="text-white/90 text-sm font-medium">END OF SEASON SALE</p>
                <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">Winter Wardrobe</h1>
                <p className="text-white/90 text-lg mt-1">Flat 50-80% Off</p>
              </div>
            </motion.div>
          </a>
          <div className="grid grid-rows-2 gap-4">
            {[
              { title: "New Arrivals", sub: "Fresh drops daily", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80", url: "https://www.myntra.com/shop/new-arrivals" },
              { title: "Studio", sub: "Trending styles", img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80", url: "https://www.myntra.com/studio/home" },
            ].map((b) => (
              <a
                key={b.title}
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  className="rounded-2xl overflow-hidden relative h-[130px] md:h-[200px] group cursor-pointer"
                >
                  <img src={b.img} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent p-5 flex flex-col justify-center">
                    <h3 className="text-white text-xl font-bold">{b.title}</h3>
                    <p className="text-white/80 text-sm">{b.sub}</p>
                  </div>
                </motion.div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
