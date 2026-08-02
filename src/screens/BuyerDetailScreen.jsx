import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Header, formatDate } from "../components/Chrome";

export default function BuyerDetailScreen({ buyer, onBack, onChanged }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(buyer.name);
  const [editEmail, setEditEmail] = useState(buyer.email || "");
  const [editPhone, setEditPhone] = useState(buyer.phone || "");
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!editName.trim()) return;
    setSaving(true);
    await supabase
      .from("buyers")
      .update({
        name: editName.trim(),
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
      })
      .eq("id", buyer.id);
    setSaving(false);
    onChanged();
    onBack();
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("buyers").delete().eq("id", buyer.id);
    setDeleting(false);
    onChanged();
    onBack();
  }

  return (
    <div className="pb-24">
      <Header
        title="Buyer"
        onBack={onBack}
        right={
          !isEditing && (
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEditing(true)} className="p-1.5 text-paper">
                <Pencil size={18} />
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 text-paper">
                <Trash2 size={18} />
              </button>
            </div>
          )
        }
      />
      <div className="p-4">
        {!isEditing ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 bg-deeprust text-paper font-mono">
              {buyer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="font-display text-xl text-ink">{buyer.name}</h2>
              {buyer.email && <div className="font-mono text-[11px] text-muted">{buyer.email}</div>}
              {buyer.phone && <div className="font-mono text-[11px] text-muted">{buyer.phone}</div>}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-rust bg-card p-3 space-y-2.5 mb-4">
            <div className="text-[11px] uppercase tracking-wide font-mono text-muted">Edit buyer</div>
            <div>
              <label className="text-[10px] uppercase font-mono text-muted">Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-muted">Email</label>
              <input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-muted">Phone</label>
              <input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold border border-sand text-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-lg font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        <div className="text-[11px] uppercase tracking-wide mb-2 font-mono text-muted">Purchase history</div>
        <div className="space-y-2">
          {(buyer.sales || []).map((s, idx) => (
            <div key={idx} className="rounded-lg p-3 bg-card border border-sand">
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-sm text-ink">{s.items?.name}</span>
                <span className="font-mono text-sm font-bold text-rust">${s.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted">
                  {formatDate(s.sale_date)}
                </span>
                <span className="font-mono text-[10px] text-muted">via {s.site}</span>
              </div>
            </div>
          ))}
          {(buyer.sales || []).length === 0 && (
            <p className="text-xs font-mono text-muted">No purchases on record.</p>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-xs rounded-lg bg-card p-4 border border-sand">
            <h3 className="font-display text-base text-ink mb-1">Delete {buyer.name}?</h3>
            <p className="text-xs font-body text-muted mb-4">
              This action cannot be undone. Their contact info will be permanently removed. Past
              sales stay in your sold history, but will no longer show a buyer name attached.
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
