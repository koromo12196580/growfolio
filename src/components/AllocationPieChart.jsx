import React, { memo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { yen } from "../utils/format.js";

// 資産の内訳(口座別)を円グラフ+凡例(口座名・金額・割合)で表示する。③の対応。
// 「現在資産」「FIRE(取り崩し開始)時点」のどちらでも使えるよう、データを外から受け取る汎用コンポーネント。
function AllocationPieChart({ title, data }) {
  const filtered = (data || []).filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <div className="ip-card">
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>{title}</div>
      {total <= 0 ? (
        <div className="ip-note">表示できる資産がありません。</div>
      ) : (
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ width: 170, height: 170, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={filtered} dataKey="value" nameKey="name" innerRadius={44} outerRadius={80} paddingAngle={2}>
                  {filtered.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => yen(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            {filtered.map((d, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5,
                padding: "6px 0", borderBottom: "1px solid #EEF0EB", alignItems: "center",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 10, background: d.color, display: "inline-block", flexShrink: 0 }} />
                  {d.name}
                </span>
                <span style={{ fontFamily: "var(--mono)", textAlign: "right" }}>
                  {yen(d.value)}({((d.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AllocationPieChart);
