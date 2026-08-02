import React, { useState } from "react";
import { Camera } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header } from "../components/Chrome";

export default function AddItemScreen({ categories, onDone, onBack, refreshCategories, sites, refreshSites, accounts, refreshAccounts }) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [cost, setCost] = useState("");
  const [value, setValue] = useState("");
  const [selectedSites, setSelectedSites] = useState([]);
  const [newSite, setNewSite] = useState("");
  const [addingSite, setAddingSite] = useState(false);
  const [fundingAccountId, setFundingAccountId] = useState("");
  const [newAccount, setNewAccount] = useState("");
  const [addingAccount, setAddingAccount] = useState(false);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleSite(siteName) {
    setSelectedSites((prev) => (prev.includes(siteName) ? prev.filter((s) => s !== siteName) : [...prev, siteName]));
  }

  async function handleCreateAccount() {
    if (!newAccount.trim()) return;
    const { data, error } = await supabase
      .from("accounts")
      .insert({ name: newAccount.trim() })
      .select()
      .single();
    if (!error) {
      await refreshAccounts();
      setFundingAccountId(data.id);
      setNewAccount("");
      setAddingAccount(false);
    } else {
      setError(error.message);
    }
  }

  async function handleCreateSite() {
    if (!newSite.trim()) return;
    const { error } = await supabase.from("sites").insert({ name: newSite.trim() });
    if (!error) {
      await refreshSites();
      setSelectedSites((prev) => [...prev, newSite.trim()]);
      setNewSite("");
      setAddingSite(false);
    } else {
      setError(error.message);
    }
  }

  async function handleCreateCategory() {
    if (!newCategory.trim()) return;
    const key = newCategory.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { data, error } = await supabase
      .from("categories")
      .insert({ key, label: newCategory.trim(), swatch: "#6B5D4F" })
      .select()
      .single();
    if (!error) {
      await refreshCategories();
      setCategoryId(data.id);
      setNewCategory("");
      setAddingCategory(false);
    } else {
      setError(error.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Give the item a name.");
      return;
    }
    setSaving(true);

    const { data: item, error: itemError } = await supabase
      .from("items")
      .insert({
        name: name.trim(),
        category_id: categoryId || null,
        cost: Number(cost) || 0,
        value: Number(value) || 0,
        funding_account_id: fundingAccountId || null,
      })
      .select()
      .single();

    if (itemError) {
      setError(itemError.message);
      setSaving(false);
      return;
    }

    if (fundingAccountId && Number(cost) > 0) {
      await supabase.from("account_transactions").insert({
        account_id: fundingAccountId,
        type: "withdrawal",
        amount: Number(cost),
        item_id: item.id,
      });
    }

    if (selectedSites.length > 0) {
      await supabase.from("listings").insert(
        selectedSites.map((site) => ({ item_id: item.id, site }))
      );
    }

    if (file) {
      const path = `${item.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("item-photos").upload(path, file);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("item-photos").getPublicUrl(path);
        await supabase.from("item_photos").insert({ item_id: item.id, url: pub.publicUrl });
      }
    }

    setSaving(false);
    onDone();
  }

  return (
    <div className="pb-24">
      <Header title="Add Item" onBack={onBack} />
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <label className="w-full h-40 rounded-lg border border-sand bg-card flex items-center justify-center overflow-hidden cursor-pointer">
          {file ? (
            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted">
              <Camera size={22} />
              <span className="text-xs font-mono">Add a photo</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <div>
          <label className="text-[11px] uppercase tracking-wide font-mono text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
            placeholder="e.g. 1989 Ken Griffey Jr. Upper Deck RC"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide font-mono text-muted">Category</label>
          {!addingCategory ? (
            <div className="flex gap-2 mt-1">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                className="px-3 py-2 rounded border border-rust text-rust text-xs font-mono"
              >
                + New
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-1">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                placeholder="Category name"
                className="flex-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="px-3 py-2 rounded bg-deeprust text-paper text-xs font-mono"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide font-mono text-muted">Paid ($)</label>
            <input
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border border-sand bg-card font-mono text-sm text-ink"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide font-mono text-muted">Est. value ($)</label>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border border-sand bg-card font-mono text-sm text-ink"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide font-mono text-muted">Funded from (optional)</label>
          {!addingAccount ? (
            <div className="flex gap-2 mt-1">
              <select
                value={fundingAccountId}
                onChange={(e) => setFundingAccountId(e.target.value)}
                className="flex-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
              >
                <option value="">None</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingAccount(true)}
                className="px-3 py-2 rounded border border-rust text-rust text-xs font-mono"
              >
                + New
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-1">
              <input
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateAccount();
                  }
                }}
                placeholder="Account name"
                className="flex-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
              />
              <button
                type="button"
                onClick={handleCreateAccount}
                className="px-3 py-2 rounded bg-deeprust text-paper text-xs font-mono"
              >
                Save
              </button>
            </div>
          )}
          {fundingAccountId && Number(cost) > 0 && (
            <p className="text-[11px] font-mono text-muted mt-1">
              Logs a ${Number(cost).toFixed(2)} withdrawal to this account.
            </p>
          )}
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide font-mono text-muted">List on</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {sites.filter((s) => s.active).map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => toggleSite(s.name)}
                className="px-3 py-1 rounded-full text-xs font-mono border border-rust"
                style={{
                  background: selectedSites.includes(s.name) ? "#2F5233" : "transparent",
                  color: selectedSites.includes(s.name) ? "#EDE6D6" : "#4A4032",
                }}
              >
                {s.name}
              </button>
            ))}
            {!addingSite ? (
              <button
                type="button"
                onClick={() => setAddingSite(true)}
                className="px-3 py-1 rounded-full text-xs font-mono border border-sand text-muted"
              >
                + New site
              </button>
            ) : (
              <div className="flex gap-2 w-full mt-1">
                <input
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateSite();
                    }
                  }}
                  placeholder="Site name"
                  className="flex-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
                />
                <button
                  type="button"
                  onClick={handleCreateSite}
                  className="px-3 py-2 rounded bg-deeprust text-paper text-xs font-mono"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-deeprust font-mono">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save item"}
        </button>
      </form>
    </div>
  );
}
