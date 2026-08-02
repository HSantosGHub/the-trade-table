import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header } from "../components/Chrome";

export default function SettingsScreen({ categories, onBack, refreshCategories }) {
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function toggle(cat) {
    await supabase.from("categories").update({ active: !cat.active }).eq("id", cat.id);
    await refreshCategories();
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    setSaving(true);
    const key = newCategory.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await supabase.from("categories").insert({ key, label: newCategory.trim(), swatch: "#6B5D4F" });
    setNewCategory("");
    setSaving(false);
    await refreshCategories();
  }

  return (
    <div className="pb-24">
      <Header title="Settings" onBack={onBack} />
      <div className="p-4">
        <div className="text-[11px] uppercase tracking-wide mb-1 font-mono text-muted">Category filters</div>
        <p className="text-xs mb-3 font-body text-muted">
          Choose which categories show up as filter chips in Inventory and Metrics. Turning one off
          doesn't touch its items or sales history — it just tidies up the filter bar.
        </p>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-card border border-sand">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.swatch, opacity: c.active ? 1 : 0.35 }} />
                <span className="font-body text-sm" style={{ color: c.active ? "#1F2A24" : "#9A9284" }}>
                  {c.label}
                </span>
              </div>
              <button
                onClick={() => toggle(c)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono"
                style={{ background: c.active ? "#2F5233" : "#D9D0BA", color: c.active ? "#EDE6D6" : "#6B5D4F" }}
              >
                {c.active ? <Eye size={12} /> : <EyeOff size={12} />}
                {c.active ? "Shown" : "Hidden"}
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="flex-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
          />
          <button
            onClick={addCategory}
            disabled={saving}
            className="px-3 py-2 rounded font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
