import React, { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header, daysSince, stalenessInfo, formatDate } from "../components/Chrome";

export default function ItemDetailScreen({ item, categories, onBack, onChanged }) {
  const [showSellForm, setShowSellForm] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [price, setPrice] = useState(item.value ?? "");
  const [site, setSite] = useState(item.listings?.[0]?.site || "eBay");
  const [saving, setSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editCategoryId, setEditCategoryId] = useState(item.category_id || "");
  const [editCost, setEditCost] = useState(item.cost);
  const [editValue, setEditValue] = useState(item.value);
  const [savingEdit, setSavingEdit] = useState(false);

  const [isEditingSale, setIsEditingSale] = useState(false);
  const [editBuyerName, setEditBuyerName] = useState(item.sales?.[0]?.buyers?.name || "");
  const [editSalePrice, setEditSalePrice] = useState(item.sales?.[0]?.price ?? "");
  const [editSaleSite, setEditSaleSite] = useState(item.sales?.[0]?.site || "");
  const [editSaleDate, setEditSaleDate] = useState(item.sales?.[0]?.sale_date || "");
  const [savingSaleEdit, setSavingSaleEdit] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cat = item.categories;
  const margin = (item.value ?? 0) - (item.cost ?? 0);
  const days = daysSince(item.acquired_date);
  const s = stalenessInfo(days);
  const photo = item.item_photos?.[0]?.url;
  const isSold = item.status === "sold";
  const sale = item.sales?.[0];

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

  async function handleSaveEdit() {
    setSavingEdit(true);
    await supabase
      .from("items")
      .update({
        name: editName.trim(),
        category_id: editCategoryId || null,
        cost: Number(editCost) || 0,
        value: Number(editValue) || 0,
      })
      .eq("id", item.id);
    setSavingEdit(false);
    onChanged();
    onBack();
  }

  async function handleSaveSaleEdit() {
    if (!sale) return;
    setSavingSaleEdit(true);

    let buyerId = sale.buyer_id || null;
    const trimmedName = editBuyerName.trim();
    if (trimmedName && trimmedName !== sale.buyers?.name) {
      const { data: existing } = await supabase
        .from("buyers")
        .select("id")
        .ilike("name", trimmedName)
        .maybeSingle();

      if (existing) {
        buyerId = existing.id;
      } else {
        const { data: created } = await supabase
          .from("buyers")
          .insert({ name: trimmedName })
          .select()
          .single();
        buyerId = created?.id || null;
      }
    }

    await supabase
      .from("sales")
      .update({
        buyer_id: buyerId,
        price: Number(editSalePrice) || 0,
        site: editSaleSite,
        sale_date: editSaleDate,
      })
      .eq("id", sale.id);

    setSavingSaleEdit(false);
    setIsEditingSale(false);
    onChanged();
    onBack();
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("items").delete().eq("id", item.id);
    setDeleting(false);
    onChanged();
    onBack();
  }

  return (
    <div className="pb-24">
      <Header
        title="Item"
        onBack={onBack}
        right={
          !isEditing && (
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-paper">
              <Pencil size={18} />
            </button>
          )
        }
      />
      <div className="p-4">
        <div className="w-full h-48 rounded-lg flex items-center justify-center mb-4 overflow-hidden bg-card border border-sand">
          {photo ? (
            <img src={photo} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">📦</span>
          )}
        </div>

        {!isEditing ? (
          <>
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
          </>
        ) : (
          <div className="rounded-lg border border-rust bg-card p-3 space-y-2.5 mb-4">
            <div className="text-[11px] uppercase tracking-wide font-mono text-muted">Edit item</div>
            <div>
              <label className="text-[10px] uppercase font-mono text-muted">Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-muted">Category</label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-mono text-muted">Paid ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-mono text-sm text-ink"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-muted">Est. value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-mono text-sm text-ink"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold border border-sand text-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {isSold && !isEditingSale && (
          <div className="rounded-lg p-3 mb-4 bg-deeprust">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase font-mono text-sand opacity-80">Sold</div>
              <button
                onClick={() => setIsEditingSale(true)}
                className="p-1 rounded-full border border-sand text-sand opacity-80"
              >
                <Pencil size={11} />
              </button>
            </div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-body text-sm text-paper">{sale?.buyers?.name || "Unknown buyer"}</span>
              <span className="font-mono text-lg font-bold text-paper">${sale?.price ?? "—"}</span>
            </div>
            {sale?.sale_date && (
              <div className="font-mono text-[11px] text-sand">
                {formatDate(sale.sale_date)} · sold via {sale.site}
              </div>
            )}
          </div>
        )}

        {isSold && isEditingSale && (
          <div className="rounded-lg border border-rust bg-card p-3 space-y-2.5 mb-4">
            <div className="text-[11px] uppercase tracking-wide font-mono text-muted">Edit sale</div>
            <div>
              <label className="text-[10px] uppercase font-mono text-muted">Buyer name</label>
              <input
                value={editBuyerName}
                onChange={(e) => setEditBuyerName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-mono text-muted">Sale price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editSalePrice}
                  onChange={(e) => setEditSalePrice(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-mono text-sm text-ink"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-muted">Sold via</label>
                <input
                  value={editSaleSite}
                  onChange={(e) => setEditSaleSite(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-mono text-sm text-ink"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-muted">Sale date</label>
              <input
                type="date"
                value={editSaleDate}
                onChange={(e) => setEditSaleDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-mono text-sm text-ink"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEditingSale(false)}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold border border-sand text-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSaleEdit}
                disabled={savingSaleEdit}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
              >
                {savingSaleEdit ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {!isSold && (
          <div className="rounded-lg p-3 mb-4 flex items-center justify-between" style={{ background: s.bg, opacity: 0.9 }}>
            <div className="font-mono text-xs" style={{ color: s.fg }}>
              On the shelf {days} days
            </div>
            <div className="font-mono text-[11px] font-bold" style={{ color: s.fg }}>
              {s.label.toUpperCase()}
            </div>
          </div>
        )}

        {!isSold && (
          <>
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
          </>
        )}

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full mt-4 py-2.5 rounded-lg font-mono text-xs font-semibold border border-deeprust text-deeprust flex items-center justify-center gap-1.5"
        >
          <Trash2 size={13} />
          Delete item
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-xs rounded-lg bg-card p-4 border border-sand">
            <h3 className="font-display text-base text-ink mb-1">Delete this item?</h3>
            <p className="text-xs font-body text-muted mb-4">
              This action cannot be undone. The item, its photo, listing history, and any sale record
              tied to it will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold border border-sand text-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold bg-deeprust text-paper disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
