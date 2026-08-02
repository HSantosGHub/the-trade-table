import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header, daysSince, stalenessInfo } from "../components/Chrome";

export default function ItemDetailScreen({ item, onBack, onChanged }) {
  const [showSellForm, setShowSellForm] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [price, setPrice] = useState(item.value ?? "");
  const [site, setSite] = useState(item.listings?.[0]?.site || "eBay");
  const [saving, setSaving] = useState(false);

  const cat = item.categories;
  const margin = (item.value ?? 0) - (item.cost ?? 0);
  const days = daysSince(item.acquired_date);
  const s = stalenessInfo(days);
  const photo = item.item_photos?.[0]?.url;

  async function handleMarkSold(e) {
    e.preventDefault();
    setSaving(true);

    let buyerId = null;
    if (buyerName.trim()) {
      // Try to find an existing buyer by name first, so purchase history rolls up.
      const { data: existing } = await supabase
        .from("buyers")
        .select("id")
        .ilike("name", buyerName.trim())
        .maybeSingle();

      if (existing) {
        buyerId = existing.id;
      } else {
        const { data: created } = await supabase
          .from("buyers")
          .insert({ name: buyerName.trim(), email: buyerEmail || null, phone: buyerPhone || null })
          .select()
          .single();
        buyerId = created?.id || null;
      }
    }

    await supabase.from("sales").insert({
      item_id: item.id,
      buyer_id: buyerId,
      price: Number(price) || 0,
      site,
    });

    await supabase.from("items").update({ status: "sold" }).eq("id", item.id);
    await supabase.from("listings").update({ active: false }).eq("item_id", item.id);

    setSaving(false);
    onChanged();
    onBack();
  }

  return (
    <div className="pb-24">
      <Header title="Item" onBack={onBack} />
      <div className="p-4">
        <div className="w-full h-48 rounded-lg flex items-center justify-center mb-4 overflow-hidden bg-card border border-sand">
          {photo ? (
            <img src={photo} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">📦</span>
          )}
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-wide mb-1 font-mono" style={{ color: cat?.swatch || "#6B5D4F" }}>
          {cat?.label || "Uncategorized"}
        </div>
        <h2 className="text-lg mb-4 font-display text-ink">{item.name}</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg p-3 bg-card border border-sand">
            <div className="text-[10px] uppercase font-mono text-muted">Paid</div>
            <div className="text-lg font-bold font-mono text-ink">${item.cost}</div>
          </div>
          <div className="rounded-lg p-3 bg-card border border-sand">
            <div className="text-[10px] uppercase font-mono text-muted">Est. Value</div>
            <div className="text-lg font-bold font-mono" style={{ color: margin >= 0 ? "#2F5233" : "#8B3A3A" }}>
              ${item.value}
            </div>
          </div>
        </div>

        <div className="rounded-lg p-3 mb-4 flex items-center justify-between" style={{ background: s.bg, opacity: 0.9 }}>
          <div className="font-mono text-xs" style={{ color: s.fg }}>
            On the shelf {days} days
          </div>
          <div className="font-mono text-[11px] font-bold" style={{ color: s.fg }}>
            {s.label.toUpperCase()}
          </div>
        </div>

        <div className="text-[11px] uppercase tracking-wide mb-2 font-mono text-muted">Listed on</div>
        <div className="space-y-2 mb-5">
          {(item.listings || []).filter((l) => l.active).map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-card border border-sand">
              <span className="font-body text-sm text-ink">{l.site}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted">
                  {daysSince(l.posted_date)}d listed
                </span>
                {l.url && <ExternalLink size={13} className="text-muted" />}
              </div>
            </div>
          ))}
          {(item.listings || []).filter((l) => l.active).length === 0 && (
            <p className="text-xs font-mono text-muted">Not currently listed anywhere.</p>
          )}
        </div>

        {!showSellForm ? (
          <button
            onClick={() => setShowSellForm(true)}
            className="w-full py-2.5 rounded-lg font-mono text-xs font-semibold bg-deeprust text-paper"
          >
            Mark as sold
          </button>
        ) : (
          <form onSubmit={handleMarkSold} className="rounded-lg border border-sand bg-card p-3 space-y-2.5">
            <div className="text-[11px] uppercase tracking-wide font-mono text-muted">Record the sale</div>
            <input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Buyer name"
              className="w-full px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="Email (optional)"
                className="px-3 py-2 rounded border border-sand bg-paper font-body text-xs text-ink"
              />
              <input
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="px-3 py-2 rounded border border-sand bg-paper font-body text-xs text-ink"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Sale price"
                className="px-3 py-2 rounded border border-sand bg-paper font-mono text-sm text-ink"
              />
              <input
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="Sold via"
                className="px-3 py-2 rounded border border-sand bg-paper font-mono text-sm text-ink"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 rounded-lg font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Confirm sale"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
