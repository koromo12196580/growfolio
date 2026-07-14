import React, { memo } from "react";
import { manYen } from "../utils/format.js";

// NISA枠(生涯枠・成長投資枠)の使用済み/残り/使用率をまとめて表示するカード。①の対応。
function NisaUsageCard({ title, used, limit, color }) {
  const remaining = Math.max(0, limit - used);
  const usedPct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="ip-card">
      <div className="ip-stat-label">{title}</div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", margin: "6px 0 10px" }}>
        <div>
          <div className="ip-note">使用済み</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, color: "var(--navy)" }}>{manYen(used)}</div>
        </div>
        <div>
          <div className="ip-note">残り</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, color }}>{manYen(remaining)}</div>
        </div>
        <div>
          <div className="ip-note">使用率</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, color: "var(--navy)" }}>{usedPct.toFixed(0)}%</div>
        </div>
      </div>
      <div style={{ background: "#EEF0EB", height: 8, borderRadius: 4 }}>
        <div style={{ width: usedPct + "%", background: color, height: 8, borderRadius: 4, transition: "width 0.2s" }} />
      </div>
    </div>
  );
}

export default memo(NisaUsageCard);
