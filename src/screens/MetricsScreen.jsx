import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "../supabaseClient";
import { Header } from "../components/Chrome";

export default function MetricsScreen() {
  const [loading, setLoading] = useState(true);
  const [sellSpeed, setSellSpeed] = useState([]);
  const [bestSite, setBestSite] = useState([]);
  const [mostPopular, setMostPopular] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("price, site, sale_date, items(acquired_date, category_id, categories(label))");

    if (error || !data) {
      setLoading(false);
      return;
    }

    // group by category
    const byCategory = {};
    for (const sale of data) {
      const label = sale.items?.categories?.label || "Uncategorized";
      const acquired = sale.items?.acquired_date;
      const daysToSell = acquired
        ? Math.max(0, Math.round((new Date(sale.sale_date) - new Date(acquired)) / 86400000))
        : null;

      if (!byCategory[label]) byCategory[label] = { days: [], sites: {}, count: 0 };
      if (daysToSell !== null) byCategory[label].days.push(daysToSell);
      byCategory[label].sites[sale.site] = (byCategory[label].sites[sale.site] || 0) + 1;
      byCategory[label].count += 1;
    }

    const speed = Object.entries(byCategory).map(([category, v]) => ({
      category,
      days: v.days.length ? Math.round(v.days.reduce((a, b) => a + b, 0) / v.days.length) : 0,
    }));

    const bestSites = Object.entries(byCategory).map(([category, v]) => {
      const top = Object.entries(v.sites).sort((a, b) => b[1] - a[1])[0];
      return {
        category,
        site: top ? top[0] : "—",
        count: top ? top[1] : 0,
        total: v.count,
      };
    });

    const popular = Object.entries(byCategory).sort((a, b) => b[1].count - a[1].count)[0];

    setSellSpeed(speed);
    setBestSite(bestSites);
    setMostPopular(popular ? { label: popular[0], count: popular[1].count } : null);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="pb-24">
        <Header title="Metrics" />
        <p className="px-4 pt-3 text-sm font-mono text-muted">Loading…</p>
      </div>
    );
  }

  if (sellSpeed.length === 0) {
    return (
      <div className="pb-24">
        <Header title="Metrics" />
        <p className="px-4 pt-3 text-sm font-mono text-muted">
          Metrics fill in once you've recorded a few sales.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <Header title="Metrics" />
      <div className="p-4 space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide mb-2 font-mono text-muted">
            Avg. days to sell, by category
          </div>
          <div className="rounded-lg p-3 bg-card border border-sand">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sellSpeed} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D0BA" />
                <XAxis dataKey="category" tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "#6B5D4F" }} axisLine={{ stroke: "#C9BFA5" }} tickLine={false} />
                <YAxis tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "#6B5D4F" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, background: "#1F2A24", border: "none", color: "#EDE6D6" }} />
                <Bar dataKey="days" fill="#2F5233" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide mb-2 font-mono text-muted">
            Best-performing site by category
          </div>
          <div className="space-y-2">
            {bestSite.map((row) => (
              <div key={row.category} className="flex items-center justify-between rounded-lg p-3 bg-card border border-sand">
                <div>
                  <div className="font-body text-sm text-ink">{row.category}</div>
                  <div className="font-mono text-[11px] text-muted">strongest on {row.site}</div>
                </div>
                <div className="px-2.5 py-1 rounded text-xs font-bold font-mono bg-rust text-[#1F2A24]">
                  {row.count}/{row.total}
                </div>
              </div>
            ))}
          </div>
        </div>

        {mostPopular && (
          <div>
            <div className="text-[11px] uppercase tracking-wide mb-2 font-mono text-muted">Most popular right now</div>
            <div className="rounded-lg p-4 flex items-center gap-3 bg-deeprust">
              <div>
                <div className="font-display text-lg text-paper">{mostPopular.label}</div>
                <div className="font-mono text-[11px] text-sand">
                  {mostPopular.count} sale{mostPopular.count === 1 ? "" : "s"} on record
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
