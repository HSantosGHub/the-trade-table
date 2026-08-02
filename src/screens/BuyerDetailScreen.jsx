import React from "react";
import { Header, formatDate } from "../components/Chrome";

export default function BuyerDetailScreen({ buyer, onBack }) {
  return (
    <div className="pb-24">
      <Header title="Buyer" onBack={onBack} />
      <div className="p-4">
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
    </div>
  );
}
