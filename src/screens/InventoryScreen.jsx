import React, { useEffect, useState } from "react";
import { Search, Plus, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header, ShelfTag, daysSince } from "../components/Chrome";

export default function InventoryScreen({ categories, onSelectItem, onAddItem, onOpenSettings }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [statusView, setStatusView] = useState("listed"); // "listed" | "sold"

  useEffect(() => {
    load();
  }, [statusView]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*, categories(*), listings(*), item_photos(*), sales(price, sale_date, site, buyers(name))")
      .eq("status", statusView)
      .order(statusView === "sold" ? "updated_at" : "created_at", { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  }

  const visibleCategories = categories.filter((c) => c.active);
  const filtered = items
    .filter((i) => (filter === "all" ? true : i.category_id === filter))
    .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="pb-24">
      <Header
        title="The Trade Table"
        showLogo
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onAddItem}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-rust text-[#1F2A24] font-mono"
            >
              <Plus size={14} /> ADD
            </button>
            <button onClick={onOpenSettings} className="p-1.5 text-paper">
              <SettingsIcon size={18} />
            </button>
          </div>
        }
      />

      <div className="flex px-4 pt-3 gap-2">
        <button
          onClick={() => setStatusView("listed")}
          className="flex-1 py-2 rounded-lg text-xs font-mono font-semibold border border-rust"
          style={{
            background: statusView === "listed" ? "#2F5233" : "transparent",
            color: statusView === "listed" ? "#EDE6D6" : "#4A4032",
          }}
        >
          Active
        </button>
        <button
          onClick={() => setStatusView("sold")}
          className="flex-1 py-2 rounded-lg text-xs font-mono font-semibold border border-rust"
          style={{
            background: statusView === "sold" ? "#2F5233" : "transparent",
            color: statusView === "sold" ? "#EDE6D6" : "#4A4032",
          }}
        >
          Sold History
        </button>
      </div>

      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card border-sand">
          <Search size={15} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={statusView === "sold" ? "Search sold items…" : "Search inventory…"}
            className="text-sm bg-transparent outline-none w-full font-body text-ink placeholder:text-muted"
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {["all", ...visibleCategories.map((c) => c.id)].map((c) => {
          const cat = visibleCategories.find((v) => v.id === c);
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="px-3 py-1 rounded-full text-xs whitespace-nowrap border font-mono border-rust"
              style={{
                background: filter === c ? "#2F5233" : "transparent",
                color: filter === c ? "#EDE6D6" : "#4A4032",
              }}
            >
              {c === "all" ? "All" : cat?.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="px-4 text-sm font-mono text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="px-4 text-sm font-mono text-muted">
          {statusView === "sold"
            ? "Nothing sold yet — sold items show up here once you mark something sold."
            : "No items yet. Tap ADD to log your first piece of inventory."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {filtered.map((item) => {
            const cat = item.categories;
            const margin = item.value - item.cost;
            const photo = item.item_photos?.[0]?.url;
            const days = daysSince(item.acquired_date);
            const sale = item.sales?.[0];
            return (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="relative text-left rounded-lg border p-3 pt-4 bg-card border-sand"
                style={{ boxShadow: "2px 3px 0 rgba(31,42,36,0.12)" }}
              >
                {statusView === "listed" && <ShelfTag days={days} />}
                {statusView === "sold" && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 text-[10px] font-bold font-mono rounded-full bg-deeprust text-paper">
                    SOLD
                  </div>
                )}
                <div className="w-full h-16 rounded flex items-center justify-center mb-2 overflow-hidden bg-paper">
                  {photo ? (
                    <img src={photo} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-wide mb-1 font-mono"
                  style={{ color: cat?.swatch || "#6B5D4F" }}
                >
                  {cat?.label || "Uncategorized"}
                </div>
                <div className="text-sm leading-tight mb-2 font-body text-ink" style={{ minHeight: "2.4em" }}>
                  {item.name}
                </div>
                {statusView === "listed" ? (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-mono text-muted">cost ${item.cost}</span>
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: margin >= 0 ? "#2F5233" : "#8B3A3A" }}
                    >
                      ${item.value}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-mono text-muted">
                        {sale?.buyers?.name || "Unknown buyer"}
                      </span>
                      <span className="text-sm font-bold font-mono text-rust">
                        ${sale?.price ?? "—"}
                      </span>
                    </div>
                    {sale?.sale_date && (
                      <div className="text-[10px] font-mono text-muted mt-0.5">
                        {new Date(sale.sale_date).toLocaleDateString()} · {sale.site}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
