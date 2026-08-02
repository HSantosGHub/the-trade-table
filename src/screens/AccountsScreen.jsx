import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header } from "../components/Chrome";

export default function AccountsScreen({ onSelectAccount, refreshAccounts }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: accountRows } = await supabase.from("accounts").select("*").order("name");
    const { data: txns } = await supabase.from("account_transactions").select("account_id, type, amount");

    const balances = {};
    (txns || []).forEach((t) => {
      const delta = t.type === "withdrawal" ? Number(t.amount) : -Number(t.amount);
      balances[t.account_id] = (balances[t.account_id] || 0) + delta;
    });

    const withBalance = (accountRows || []).map((a) => ({ ...a, owed: balances[a.id] || 0 }));
    setAccounts(withBalance);
    setLoading(false);
  }

  async function addAccount() {
    if (!newAccountName.trim()) return;
    setSaving(true);
    await supabase.from("accounts").insert({ name: newAccountName.trim() });
    setNewAccountName("");
    setAddingAccount(false);
    setSaving(false);
    await load();
    if (refreshAccounts) await refreshAccounts();
  }

  return (
    <div className="pb-24">
      <Header
        title="Accounts"
        right={
          <button
            onClick={() => setAddingAccount(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-rust text-[#1F2A24] font-mono"
          >
            <Plus size={14} /> ADD
          </button>
        }
      />

      <div className="p-4">
        <p className="text-xs font-body text-muted mb-4">
          Track money moved out of an account to fund inventory, and log it back whenever it's paid
          back. The balance shown is what's currently owed to that account.
        </p>

        {addingAccount && (
          <div className="flex gap-2 mb-4">
            <input
              autoFocus
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAccount();
                }
              }}
              placeholder="Account name (e.g. Joint Checking)"
              className="flex-1 px-3 py-2 rounded border border-sand bg-card font-body text-sm text-ink"
            />
            <button
              onClick={addAccount}
              disabled={saving}
              className="px-3 py-2 rounded font-mono text-xs font-semibold bg-deeprust text-paper disabled:opacity-60"
            >
              Save
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-sm font-mono text-muted">Loading…</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm font-mono text-muted">
            No accounts yet. Tap ADD to set one up (e.g. "Joint Checking").
          </p>
        ) : (
          <div className="space-y-2">
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectAccount(a)}
                className="w-full text-left rounded-lg p-3 flex items-center justify-between bg-card border border-sand"
              >
                <span className="font-body text-sm text-ink">{a.name}</span>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: a.owed > 0 ? "#B54A2C" : "#2F5233" }}
                >
                  {a.owed > 0 ? `Owed $${a.owed.toFixed(2)}` : "Settled up"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
