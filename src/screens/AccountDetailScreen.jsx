import React, { useEffect, useState } from "react";
import { Pencil, Check } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header, formatDate } from "../components/Chrome";

export default function AccountDetailScreen({ account, onBack, onChanged }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(account.name);
  const [savingName, setSavingName] = useState(false);
  const [suggestPayback, setSuggestPayback] = useState(account.suggest_payback);

  const [showForm, setShowForm] = useState(null); // "withdrawal" | "deposit" | null
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("account_transactions")
      .select("*, items(name)")
      .eq("account_id", account.id)
      .order("txn_date", { ascending: false })
      .order("created_at", { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  }

  const owed = transactions.reduce(
    (sum, t) => sum + (t.type === "withdrawal" ? Number(t.amount) : -Number(t.amount)),
    0
  );

  async function saveRename() {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSavingName(true);
    await supabase.from("accounts").update({ name: trimmed }).eq("id", account.id);
    setSavingName(false);
    setIsEditingName(false);
    onChanged();
  }

  async function toggleSuggestPayback() {
    const next = !suggestPayback;
    setSuggestPayback(next);
    await supabase.from("accounts").update({ suggest_payback: next }).eq("id", account.id);
  }

  async function submitTransaction() {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    await supabase.from("account_transactions").insert({
      account_id: account.id,
      type: showForm,
      amount: Number(amount),
      note: note.trim() || null,
    });
    setAmount("");
    setNote("");
    setShowForm(null);
    setSaving(false);
    await load();
    onChanged();
  }

  return (
    <div className="pb-24">
      <Header title="Account" onBack={onBack} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          {isEditingName ? (
            <div className="flex gap-2 flex-1">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveRename()}
                className="flex-1 px-3 py-2 rounded border border-rust bg-card font-body text-sm text-ink"
              />
              <button onClick={saveRename} disabled={savingName} className="p-2 rounded-full bg-rust text-paper">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl text-ink">{account.name}</h2>
              <button onClick={() => setIsEditingName(true)} className="p-1.5 rounded-full border border-sand text-muted">
                <Pencil size={12} />
              </button>
            </>
          )}
        </div>

        <div className="rounded-lg p-4 my-4" style={{ background: owed > 0 ? "#7A2E1A" : "#2F5233" }}>
          <div className="text-[10px] uppercase font-mono text-sand opacity-80">
            {owed > 0 ? "Currently owed" : "Balance"}
          </div>
          <div className="font-mono text-2xl font-bold text-paper">
            ${Math.abs(owed).toFixed(2)}
          </div>
          {owed <= 0 && <div className="font-mono text-[11px] text-sand opacity-80">Settled up</div>}
        </div>

        <label className="flex items-center justify-between rounded-lg p-3 mb-4 bg-card border border-sand">
          <span className="text-xs font-body text-ink">Suggest paying this account back after a sale</span>
          <input type="checkbox" checked={suggestPayback} onChange={toggleSuggestPayback} className="w-4 h-4 accent-[#B54A2C]" />
        </label>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowForm(showForm === "withdrawal" ? null : "withdrawal")}
            className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold border border-deeprust text-deeprust"
          >
            Log withdrawal
          </button>
          <button
            onClick={() => setShowForm(showForm === "deposit" ? null : "deposit")}
            className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold bg-rust text-[#1F2A24]"
          >
            Log payback
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-rust bg-card p-3 space-y-2.5 mb-4">
            <div className="text-[11px] uppercase tracking-wide font-mono text-muted">
              {showForm === "withdrawal" ? "Money taken out" : "Money paid back"}
            </div>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount ($)"
              className="w-full px-3 py-2 rounded border border-sand bg-paper font-mono text-sm text-ink"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="w-full px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
            />
            <button
              onClick={submitTransaction}
              disabled={saving}
              className="w-full py-2 rounded-lg font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}

        <div className="text-[11px] uppercase tracking-wide mb-2 font-mono text-muted">History</div>
        {loading ? (
          <p className="text-sm font-mono text-muted">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm font-mono text-muted">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="rounded-lg p-3 bg-card border border-sand">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-body text-sm text-ink">
                    {t.type === "withdrawal" ? "Withdrawal" : "Payback"}
                    {t.items?.name ? ` — ${t.items.name}` : ""}
                  </span>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: t.type === "withdrawal" ? "#B54A2C" : "#2F5233" }}
                  >
                    {t.type === "withdrawal" ? "-" : "+"}${Number(t.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted">{formatDate(t.txn_date)}</span>
                  {t.note && <span className="font-mono text-[10px] text-muted">{t.note}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
