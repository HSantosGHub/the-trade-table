import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header } from "../components/Chrome";

export default function BuyersScreen({ onSelectBuyer }) {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("buyers")
      .select("*, sales(price, sale_date, site, items(name))")
      .order("name");
    if (!error) setBuyers(data || []);
    setLoading(false);
  }

  const filtered = buyers.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="pb-24">
      <Header title="Buyers" />
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card border-sand">
          <Search size={15} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buyers…"
            className="text-sm bg-transparent outline-none w-full font-body text-ink placeholder:text-muted"
          />
        </div>
      </div>

      {loading ? (
        <p className="px-4 pt-3 text-sm font-mono text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="px-4 pt-3 text-sm font-mono text-muted">
          No buyers yet — they're added automatically the first time you mark an item sold.
        </p>
      ) : (
        <div className="px-4 pt-3 space-y-2">
          {filtered.map((b) => {
            const total = (b.sales || []).reduce((sum, s) => sum + Number(s.price), 0);
            return (
              <button
                key={b.id}
                onClick={() => onSelectBuyer(b)}
                className="w-full text-left rounded-lg p-3 flex items-center gap-3 bg-card border border-sand"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-deeprust text-paper font-mono">
                  {b.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body text-sm text-ink">{b.name}</div>
                  <div className="font-mono text-[11px] text-muted">
                    {(b.sales || []).length} purchase{(b.sales || []).length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="font-mono text-sm font-bold text-rust">${total}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
