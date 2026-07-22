import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Camera, Eye, Heart, Sparkles, Pencil, Trash2, X } from "lucide-react";
import wardrobeImg from "@/assets/wardrobe-illustration.jpg";
import { deleteWardrobeItem, getWardrobeItems, resolveImageUrl, updateWardrobeItem, uploadWardrobeItem } from "@/lib/api";
import { Link } from "@tanstack/react-router";

export function DigitalCloset({ showAll = false }: { showAll?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Search & Filter States
  const [q, setQ] = useState("");
  const [searchTemp, setSearchTemp] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [season, setSeason] = useState("");
  const [occasion, setOccasion] = useState("");

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await getWardrobeItems({
        q,
        category,
        color,
        season,
        occasion,
        page,
        limit: showAll ? 8 : 4,
      });

      if (res && typeof res === "object" && "items" in res) {
        setItems(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else {
        setItems(Array.isArray(res) ? res : []);
        setTotal(Array.isArray(res) ? res.length : 0);
        setTotalPages(1);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wardrobe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [q, category, color, season, occasion, page, showAll]);

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  const handleSearchSubmit = () => {
    setQ(searchTemp);
    setPage(1);
  };

  const handleReset = () => {
    setQ("");
    setSearchTemp("");
    setCategory("");
    setColor("");
    setSeason("");
    setOccasion("");
    setPage(1);
  };

  const stats = useMemo(() => {
    const favorites = items.filter((item) => item.favorite).length;
    const categories = new Set(items.map((item) => item.category).filter(Boolean)).size;
    return [
      { label: "Total Clothes", value: total.toString(), icon: "Shirt" },
      { label: "Favorites", value: favorites.toString(), icon: "Heart" },
      { label: "Categories", value: categories.toString(), icon: "Package" },
    ];
  }, [items, total]);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      formData.append("name", file.name);
      const response = await uploadWardrobeItem(formData);
      const analysis = response?.analysis || response?.item || {};
      if (analysis) {
        const summary = `${analysis.category || analysis.clothingType || 'Top'} • ${analysis.color || 'Neutral'} • ${analysis.season || 'All'} • ${analysis.pattern || 'Solid'}`;
        setLastAnalysis(summary);
      }
      await loadItems();
      window.dispatchEvent(new Event("closet_updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      category: item.category,
      color: item.color,
      season: item.season,
      occasion: item.occasion,
      favorite: item.favorite,
    });
  };

  const saveEdit = async (id: string | number) => {
    try {
      await updateWardrobeItem(id, draft);
      await loadItems();
      window.dispatchEvent(new Event("closet_updated"));
      setEditingId(null);
      setDraft({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const removeItem = async (id: string | number) => {
    try {
      await deleteWardrobeItem(id);
      await loadItems();
      window.dispatchEvent(new Event("closet_updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-12">
      <SectionHeader badge="AI POWERED" title="Your Digital Closet" subtitle="Upload clothing, keep it organized, and manage it from one place." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative rounded-3xl overflow-hidden p-8" style={{ background: "linear-gradient(135deg, oklch(0.97 0.02 20), oklch(0.94 0.05 350))" }}>
          <div className="absolute -top-8 -right-8 w-64 h-64 rounded-full opacity-40 blur-3xl" style={{ background: "oklch(0.75 0.2 12)" }} />
          <img src={wardrobeImg} alt="Digital Closet" width={1024} height={1024} className="relative w-full max-w-md mx-auto rounded-2xl" />
          <div className="relative flex flex-wrap gap-2 mt-6 justify-center">
            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:shadow-[var(--shadow-myntra)] hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading…" : "Upload Clothes"}
              <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0] || null)} />
            </label>
            <SecondaryBtn icon={Camera}>Scan with Camera</SecondaryBtn>
            {showAll ? (
              <Link to="/">
                <SecondaryBtn icon={Eye}>Go Back Home</SecondaryBtn>
              </Link>
            ) : (
              <Link to="/closet">
                <SecondaryBtn icon={Eye}>View My Closet</SecondaryBtn>
              </Link>
            )}
          </div>
        </motion.div>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }} className="rounded-xl border border-border bg-card p-4 hover:shadow-[var(--shadow-myntra)] hover:border-primary/30 transition-all cursor-pointer">
                <div className="text-2xl font-black text-myntra-dark">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-myntra-dark">Live closet data</h4>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : loading ? <p className="text-sm text-muted-foreground">Loading wardrobe…</p> : <div className="space-y-2"><p className="text-sm text-muted-foreground">{total ? `${total} items synced from the backend.` : "No wardrobe items yet. Upload one to get started."}</p>{lastAnalysis ? <p className="text-sm font-medium text-primary">Latest analysis: {lastAnalysis}</p> : null}</div>}
          </div>
        </div>
      </div>

      {showAll ? (
        <div className="mt-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-myntra-dark">Wardrobe Inventory</h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full border border-border bg-white overflow-hidden shadow-sm hover:border-primary/40 transition-colors">
                <input
                  type="text"
                  placeholder="Search closet..."
                  className="px-4 py-1.5 text-xs text-myntra-dark outline-none w-48"
                  value={searchTemp}
                  onChange={(e) => setSearchTemp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                />
                <button
                  onClick={handleSearchSubmit}
                  className="bg-primary text-white px-4 py-1.5 text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  Search
                </button>
              </div>
              
              {(q || category || color || season || occasion) && (
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-primary border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-myntra-dark outline-none cursor-pointer hover:border-primary/40"
              value={category}
              onChange={(e) => handleFilterChange(setCategory, e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Top">Topwear</option>
              <option value="Bottom">Bottomwear</option>
              <option value="Dress">Dresses</option>
              <option value="Outerwear">Outerwear</option>
              <option value="Shoes">Shoes</option>
              <option value="Accessory">Accessories</option>
            </select>

            <select
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-myntra-dark outline-none cursor-pointer hover:border-primary/40"
              value={color}
              onChange={(e) => handleFilterChange(setColor, e.target.value)}
            >
              <option value="">All Colors</option>
              <option value="Black">Black</option>
              <option value="White">White</option>
              <option value="Blue">Blue</option>
              <option value="Red">Red</option>
              <option value="Green">Green</option>
              <option value="Yellow">Yellow</option>
              <option value="Grey">Grey</option>
              <option value="Navy">Navy</option>
              <option value="Beige">Beige</option>
              <option value="Brown">Brown</option>
              <option value="Pink">Pink</option>
            </select>

            <select
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-myntra-dark outline-none cursor-pointer hover:border-primary/40"
              value={season}
              onChange={(e) => handleFilterChange(setSeason, e.target.value)}
            >
              <option value="">All Seasons</option>
              <option value="Summer">Summer</option>
              <option value="Winter">Winter</option>
              <option value="Spring">Spring</option>
              <option value="Autumn">Autumn</option>
              <option value="All">All-Season</option>
            </select>

            <select
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-myntra-dark outline-none cursor-pointer hover:border-primary/40"
              value={occasion}
              onChange={(e) => handleFilterChange(setOccasion, e.target.value)}
            >
              <option value="">All Occasions</option>
              <option value="Casual">Casual</option>
              <option value="Formal">Formal</option>
              <option value="Office">Office</option>
              <option value="Sportswear">Sportswear</option>
              <option value="Party">Party</option>
            </select>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center bg-card border border-border rounded-2xl animate-pulse">Loading closet items…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center bg-card border border-border rounded-2xl">
              No items match your search/filter criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, index) => (
                  <ClosetCard
                    key={item.id}
                    item={item}
                    index={index}
                    editing={editingId === item.id}
                    draft={draft}
                    onEdit={() => startEdit(item)}
                    onSave={() => saveEdit(item.id)}
                    onCancel={() => {
                      setEditingId(null);
                      setDraft({});
                    }}
                    onDelete={() => removeItem(item.id)}
                    onChange={(field: string, value: string | boolean) =>
                      setDraft((prev) => ({ ...prev, [field]: value }))
                    }
                    onViewDetail={() => setSelectedItem(item)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-myntra-dark hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-muted-foreground font-semibold">
                    Page {page} of {totalPages} ({total} items)
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-myntra-dark hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-myntra-dark">Recently Added to Closet</h3>
            {items.length > 0 && (
              <Link to="/closet" className="text-xs font-bold text-primary hover:underline">
                View Full Closet →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center bg-card border border-border rounded-2xl animate-pulse">Loading closet preview…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center bg-card border border-border rounded-2xl">
              No wardrobe items yet. Upload one above to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item, index) => (
                <ClosetCard
                  key={item.id}
                  item={item}
                  index={index}
                  editing={editingId === item.id}
                  draft={draft}
                  onEdit={() => startEdit(item)}
                  onSave={() => saveEdit(item.id)}
                  onCancel={() => {
                    setEditingId(null);
                    setDraft({});
                  }}
                  onDelete={() => removeItem(item.id)}
                  onChange={(field: string, value: string | boolean) =>
                    setDraft((prev) => ({ ...prev, [field]: value }))
                  }
                  onViewDetail={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl rounded-3xl bg-card border border-border overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 border border-border flex items-center justify-center hover:bg-white transition-colors"
            >
              <X className="w-4 h-4 text-myntra-dark" />
            </button>

            <div className="w-full md:w-1/2 bg-secondary relative min-h-[300px]">
              <img
                src={resolveImageUrl(selectedItem.imageUrl) || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80"}
                alt={selectedItem.name}
                className="w-full h-full object-cover absolute inset-0"
              />
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto space-y-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase bg-primary/10 px-2.5 py-1 rounded-full">
                  {selectedItem.category}
                </span>
                
                <h3 className="text-xl font-black text-myntra-dark mt-3">{selectedItem.name}</h3>
                
                {selectedItem.brand && (
                  <p className="text-xs text-muted-foreground font-semibold mt-1">Brand: {selectedItem.brand}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Color</span>
                    <p className="text-sm font-bold text-myntra-dark mt-0.5">{selectedItem.color || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Pattern</span>
                    <p className="text-sm font-bold text-myntra-dark mt-0.5">{selectedItem.pattern || 'Solid'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Season</span>
                    <p className="text-sm font-bold text-myntra-dark mt-0.5">{selectedItem.season || 'All'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Occasion</span>
                    <p className="text-sm font-bold text-myntra-dark mt-0.5">{selectedItem.occasion || 'Casual'}</p>
                  </div>
                </div>

                {selectedItem.notes && (
                  <div className="mt-6">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Notes</span>
                    <p className="text-xs text-muted-foreground mt-1 bg-secondary/50 p-3 rounded-xl border border-border/40 leading-5">
                      {selectedItem.notes}
                    </p>
                  </div>
                )}

                {Array.isArray(selectedItem.aiTags) && selectedItem.aiTags.length > 0 && (
                  <div className="mt-6">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">AI Vision Tags</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedItem.aiTags.map((tag: string) => (
                        <TinyTag key={tag}>{tag}</TinyTag>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
                <span className="text-[10px] text-muted-foreground">
                  Added on {new Date(selectedItem.createdAt).toLocaleDateString()}
                </span>
                {selectedItem.favorite ? (
                  <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                    ★ Favorite
                  </span>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}

function ClosetCard({ item, index, editing, draft, onEdit, onSave, onCancel, onDelete, onChange, onViewDetail }: { item: any; index: number; editing: boolean; draft: Record<string, unknown>; onEdit: () => void; onSave: () => void; onCancel: () => void; onDelete: () => void; onChange: (field: string, value: string | boolean) => void; onViewDetail: () => void; }) {
  const imageUrl = resolveImageUrl(item.imageUrl) || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80";
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} viewport={{ once: true }} whileHover={{ y: -6 }} className="group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-[var(--shadow-elevated)] hover:border-primary/40 transition-all">
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary cursor-pointer" onClick={onViewDetail}>
        <img src={imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        <button className="absolute top-2 right-2 w-8 h-8 rounded-full glass-card flex items-center justify-center hover:scale-110 transition-transform" onClick={onDelete}>
          <Trash2 className="w-4 h-4 text-myntra-dark" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        {editing ? (
          <div className="space-y-2 text-sm">
            <input className="w-full rounded border px-2 py-1" value={(draft.name as string) || ""} onChange={(event) => onChange("name", event.target.value)} placeholder="Name" />
            <input className="w-full rounded border px-2 py-1" value={(draft.category as string) || ""} onChange={(event) => onChange("category", event.target.value)} placeholder="Category" />
            <input className="w-full rounded border px-2 py-1" value={(draft.color as string) || ""} onChange={(event) => onChange("color", event.target.value)} placeholder="Color" />
            <input className="w-full rounded border px-2 py-1" value={(draft.season as string) || ""} onChange={(event) => onChange("season", event.target.value)} placeholder="Season" />
            <input className="w-full rounded border px-2 py-1" value={(draft.occasion as string) || ""} onChange={(event) => onChange("occasion", event.target.value)} placeholder="Occasion" />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={Boolean(draft.favorite)} onChange={(event) => onChange("favorite", event.target.checked)} />
              Favorite
            </label>
            <div className="flex gap-2">
              <button className="rounded bg-primary px-2 py-1 text-xs text-white" onClick={onSave}>Save</button>
              <button className="rounded border px-2 py-1 text-xs" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-myntra-dark truncate">{item.name}</h4>
              <button className="text-primary" onClick={onEdit} aria-label="Edit item"><Pencil className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <TinyTag>{item.category}</TinyTag>
              <TinyTag>{item.color}</TinyTag>
              <TinyTag>{item.season}</TinyTag>
              {item.pattern ? <TinyTag>{item.pattern}</TinyTag> : null}
              {item.occasion ? <TinyTag>{item.occasion}</TinyTag> : null}
            </div>
            {Array.isArray(item.aiTags) && item.aiTags.length ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.aiTags
                  .filter((tag: string) => tag !== item.category && tag !== item.color && tag !== item.season && tag !== item.pattern && tag !== item.occasion)
                  .slice(0, 3)
                  .map((tag: string) => <TinyTag key={tag}>{tag}</TinyTag>)}
              </div>
            ) : null}
            {item.favorite ? <span className="text-[10px] font-semibold uppercase text-primary">Favorite</span> : null}
          </>
        )}
      </div>
    </motion.div>
  );
}

export function TinyTag({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">{children}</span>;
}

export function SectionHeader({ badge, title, subtitle }: { badge?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      {badge && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary">
          <Sparkles className="w-3 h-3" />
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-myntra-dark mt-3">{title}</h2>
      {subtitle && <p className="text-muted-foreground mt-2 text-base">{subtitle}</p>}
    </div>
  );
}

export function SecondaryBtn({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-border text-myntra-dark text-sm font-bold hover:border-primary hover:text-primary hover:scale-[1.03] transition-all">
      <Icon className="w-4 h-4" /> {children}
    </button>
  );
}
