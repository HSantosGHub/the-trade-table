import React, { useState } from "react";
import { Eye, EyeOff, Pencil, Check, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header } from "../components/Chrome";

export default function SettingsScreen({ categories, onBack, refreshCategories, sites, refreshSites }) {
  const [newCategory, setNewCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatValue, setEditCatValue] = useState("");

  const [newSite, setNewSite] = useState("");
  const [savingSite, setSavingSite] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState(null);
  const [editSiteValue, setEditSiteValue] = useState("");

  const [checkingDeleteId, setCheckingDeleteId] = useState(null);
  const [blockedDelete, setBlockedDelete] = useState(null); // { id, count }
  const [deleteCandidate, setDeleteCandidate] = useState(null); // category object
  const [deletingCategory, setDeletingCategory] = useState(false);

  async function toggleCategory(cat) {
    await supabase.from("categories").update({ active: !cat.active }).eq("id", cat.id);
    await refreshCategories();
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    setSavingCategory(true);
    const key = newCategory.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await supabase.from("categories").insert({ key, label: newCategory.trim(), swatch: "#6B5D4F" });
    setNewCategory("");
    setSavingCategory(false);
    await refreshCategories();
  }

  function startEditingCategory(cat) {
    setEditingCatId(cat.id);
    setEditCatValue(cat.label);
  }

  async function saveCategoryRename(cat) {
    const trimmed = editCatValue.trim();
    if (trimmed && trimmed !== cat.label) {
      await supabase.from("categories").update({ label: trimmed }).eq("id", cat.id);
      await refreshCategories();
    }
    setEditingCatId(null);
  }

  async function handleDeleteClick(cat) {
    setBlockedDelete(null);
    setCheckingDeleteId(cat.id);
    const { count } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("category_id", cat.id);
    setCheckingDeleteId(null);
    if (count && count > 0) {
      setBlockedDelete({ id: cat.id, count });
    } else {
      setDeleteCandidate(cat);
    }
  }

  async function confirmDeleteCategory() {
    if (!deleteCandidate) return;
    setDeletingCategory(true);
    await supabase.from("categories").delete().eq("id", deleteCandidate.id);
    setDeletingCategory(false);
    setDeleteCandidate(null);
    await refreshCategories();
  }

  async function toggleSite(site) {
    await supabase.from("sites").update({ active: !site.active }).eq("id", site.id);
    await refreshSites();
  }

  async function addSite() {
    if (!newSite.trim()) return;
    setSavingSite(true);
    await supabase.from("sites").insert({ name: newSite.trim() });
    setNewSite("");
    setSavingSite(false);
    await refreshSites();
  }

  function startEditingSite(site) {
    setEditingSiteId(site.id);
    setEditSiteValue(site.name);
  }

  async function saveSiteRename(site) {
    const trimmed = editSiteValue.trim();
    if (trimmed && trimmed !== site.name) {
      await supabase.from("sites").update({ name: trimmed }).eq("id", site.id);
      await refreshSites();
    }
    setEditingSiteId(null);
  }

  return (
    <div className="pb-24">
      <Header title="Settings" onBack={onBack} />
      <div className="p-4">
        <div className="text-[11px] uppercase tracking-wide mb-1 font-mono text-muted">Category filters</div>
        <p className="text-xs mb-3 font-body text-muted">
          Choose which categories show up as filter chips in Inventory and Metrics. Turning one off
          doesn't touch its items or sales history — it just tidies up the filter bar. Tap the pencil
          to rename a category, or the trash icon to permanently delete one that's never been used.
        </p>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-card border border-sand">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.swatch, opacity: c.active ? 1 : 0.35 }} />
                  {editingCatId === c.id ? (
                    <input
                      autoFocus
                      value={editCatValue}
                      onChange={(e) => setEditCatValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveCategoryRename(c)}
                      className="flex-1 min-w-0 px-2 py-1 rounded border border-rust bg-paper font-body text-sm text-ink"
                    />
                  ) : (
                    <span className="font-body text-sm truncate" style={{ color: c.active ? "#1F2A24" : "#9A9284" }}>
                      {c.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {editingCatId === c.id ? (
                    <button onClick={() => saveCategoryRename(c)} className="p-1.5 rounded-full bg-rust text-paper">
                      <Check size={12} />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => startEditingCategory(c)} className="p-1.5 rounded-full border border-sand text-muted">
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(c)}
                        disabled={checkingDeleteId === c.id}
                        className="p-1.5 rounded-full border border-sand text-muted disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleCategory(c)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono"
                    style={{ background: c.active ? "#2F5233" : "#D9D0BA", color: c.active ? "#EDE6D6" : "#6B5D4F" }}
                  >
                    {c.active ? <Eye size={12} /> : <EyeOff size={12} />}
                    {c.active ? "Shown" : "Hidden"}
                  </button>
                </div>
              </div>
              {blockedDelete?.id === c.id && (
                <p className="text-[11px] font-mono text-deeprust mt-1 px-1">
                  Can't delete — {blockedDelete.count} item{blockedDelete.count === 1 ? "" : "s"} still use this category.
                  Hide it instead, or reassign those items first.
                </p>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-xs font-mono text-muted">No categories yet — add your first one below.</p>
          )}
        </div>

        <div className="flex gap-2 mt-4 mb-8">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="flex-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
          />
          <button
            onClick={addCategory}
            disabled={savingCategory}
            className="px-3 py-2 rounded font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
          >
            + Add
          </button>
        </div>

        <div className="text-[11px] uppercase tracking-wide mb-1 font-mono text-muted">Listing sites</div>
        <p className="text-xs mb-3 font-body text-muted">
          Choose which sites show up as options when listing an item. Hiding one doesn't touch past
          listings — it just keeps the picker from getting cluttered with places you don't use.
        </p>
        <div className="space-y-2">
          {sites.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-card border border-sand">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {editingSiteId === s.id ? (
                  <input
                    autoFocus
                    value={editSiteValue}
                    onChange={(e) => setEditSiteValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveSiteRename(s)}
                    className="flex-1 min-w-0 px-2 py-1 rounded border border-rust bg-paper font-body text-sm text-ink"
                  />
                ) : (
                  <span className="font-body text-sm truncate" style={{ color: s.active ? "#1F2A24" : "#9A9284" }}>
                    {s.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {editingSiteId === s.id ? (
                  <button onClick={() => saveSiteRename(s)} className="p-1.5 rounded-full bg-rust text-paper">
                    <Check size={12} />
                  </button>
                ) : (
                  <button onClick={() => startEditingSite(s)} className="p-1.5 rounded-full border border-sand text-muted">
                    <Pencil size={12} />
                  </button>
                )}
                <button
                  onClick={() => toggleSite(s)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono"
                  style={{ background: s.active ? "#2F5233" : "#D9D0BA", color: s.active ? "#EDE6D6" : "#6B5D4F" }}
                >
                  {s.active ? <Eye size={12} /> : <EyeOff size={12} />}
                  {s.active ? "Shown" : "Hidden"}
                </button>
              </div>
            </div>
          ))}
          {sites.length === 0 && (
            <p className="text-xs font-mono text-muted">No sites yet — add your first one below.</p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            placeholder="New site name"
            className="flex-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
          />
          <button
            onClick={addSite}
            disabled={savingSite}
            className="px-3 py-2 rounded font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
          >
            + Add
          </button>
        </div>
      </div>

      {deleteCandidate && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-xs rounded-lg bg-card p-4 border border-sand">
            <h3 className="font-display text-base text-ink mb-1">Delete "{deleteCandidate.label}"?</h3>
            <p className="text-xs font-body text-muted mb-4">
              This action cannot be undone. This category isn't used by any items, so it's safe to
              remove permanently.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold border border-sand text-muted"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                disabled={deletingCategory}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold bg-deeprust text-paper disabled:opacity-60"
              >
                {deletingCategory ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
