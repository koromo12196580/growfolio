import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { listSimulations, loadSimulation } from "../storage/storageAdapter.js";
import { computeScenarioSummary, mergeSeriesByAge } from "../utils/simulate.js";
import { yen, manYen } from "../utils/format.js";

const PALETTE = ["var(--navy)", "var(--tsumitate)", "var(--taxable)", "var(--ideco)", "var(--kigyo)"];
const MAX_COMPARE = 5;

const METRICS = [
  { key: "finalAsset", label: "最終資産(取り崩し開始時点)", fmt: yen },
  { key: "fireAge", label: "FIRE年齢", fmt: (v) => (v != null ? `${v}歳` : "-") },
  { key: "achievementAge", label: "目標達成年齢", fmt: (v) => (v != null ? `${v}歳` : "未達成") },
  { key: "totalContribution", label: "累計投資額", fmt: yen },
  { key: "totalGain", label: "運用益", fmt: yen },
  { key: "fourPercentAnnual", label: "4%ルール年間取り崩し額", fmt: yen },
  { key: "firstYearWithdrawal", label: "初年度取り崩し額", fmt: yen },
  { key: "depletionAge", label: "資産寿命", fmt: (v, s) => (v != null ? `${v}歳で枯渇` : `${s.horizonAge}歳時点で残あり`) },
];

// 保存済みプランを2〜5件選んで、資産推移グラフと主要指標を並べて比較する。④の対応。
// 各プランの再計算にはutils/simulate.jsのcomputeScenarioSummaryを使い、既存の計算ロジックをそのまま再利用している。
export default function CompareTab() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { listSimulations().then(setScenarios); }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (selectedIds.length === 0) { setSummaries({}); return; }
      setLoading(true);
      const entries = await Promise.all(selectedIds.map(async (id) => {
        const data = await loadSimulation(id);
        return [id, data ? computeScenarioSummary(data) : null];
      }));
      if (cancelled) return;
      const map = {};
      entries.forEach(([id, summary]) => { map[id] = summary; });
      setSummaries(map);
      setLoading(false);
    }
    run();
    return () => { cancelled = true; };
  }, [selectedIds]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const namedSeries = selectedIds.map((id, i) => {
    const meta = scenarios.find((s) => s.id === id);
    const summary = summaries[id];
    return { name: meta ? meta.name : id, color: PALETTE[i % PALETTE.length], series: summary ? summary.series : [] };
  });

  const mergedData = useMemo(() => mergeSeriesByAge(namedSeries), [summaries, selectedIds, scenarios]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="ip-card">
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 10 }}>比較するプランを選択(最大{MAX_COMPARE}件)</div>
        {scenarios.length === 0 ? (
          <div className="ip-note">
            保存済みプランがありません。「積立プラン」タブ上部の「保存済みプラン」から、比較したいプランを2つ以上保存してください。
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {scenarios.map((s, i) => {
              const checked = selectedIds.includes(s.id);
              const colorIdx = selectedIds.indexOf(s.id);
              return (
                <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(s.id)} />
                  {checked && (
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: PALETTE[colorIdx % PALETTE.length], display: "inline-block" }} />
                  )}
                  <span>{s.name}</span>
                  <span className="ip-note">({new Date(s.updatedAt).toLocaleDateString("ja-JP")})</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <>
          <div className="ip-card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>資産推移の比較</div>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={mergedData}>
                <CartesianGrid stroke="#E5E7E0" strokeDasharray="3 3" />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: "年齢", position: "insideBottom", offset: -3, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => manYen(v)} width={80} />
                <Tooltip formatter={(v) => (v == null ? "-" : yen(v))} labelFormatter={(l) => l + "歳"} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {namedSeries.map((ns) => (
                  <Line key={ns.name} type="monotone" dataKey={ns.name} stroke={ns.color} dot={false} strokeWidth={2} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {loading && <div className="ip-note" style={{ marginTop: 8 }}>計算中…</div>}
          </div>

          <div className="ip-card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>主要指標の比較</div>
            <div className="ip-table-wrap">
              <table className="ip-table">
                <thead>
                  <tr>
                    <th>指標</th>
                    {namedSeries.map((ns) => <th key={ns.name} style={{ color: ns.color }}>{ns.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((m) => (
                    <tr key={m.key}>
                      <td>{m.label}</td>
                      {selectedIds.map((id) => {
                        const s = summaries[id];
                        return <td key={id} style={{ fontFamily: "var(--mono)" }}>{s ? m.fmt(s[m.key], s) : "…"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
