import React, { memo } from "react";
import MoneyInput from "./inputs/MoneyInput.jsx";
import { manYen } from "../utils/format.js";

function GoalCard({ profile, setProfile, currentTotalAssets, achievement }) {
  const pct = profile.targetAmount > 0 ? (currentTotalAssets / profile.targetAmount) * 100 : 0;
  const barPct = Math.max(0, Math.min(100, pct));
  const blocks = 10;
  const filled = Math.round((barPct / 100) * blocks);
  const remainingAmount = Math.max(0, profile.targetAmount - currentTotalAssets);
  const remainingYears = achievement ? Math.max(0, achievement.age - profile.currentAge) : null;

  return (
    <div className="ip-card">
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <label className="ip-input-label">目標金額(FIRE目標など)</label>
            <MoneyInput value={profile.targetAmount} onChange={(v) => setProfile((p) => ({ ...p, targetAmount: v }))} style={{ width: 180 }} />
          </div>
          <div>
            <label className="ip-input-label">目標金額の基準</label>
            <select className="ip-select" value={profile.targetBasis}
              onChange={(e) => setProfile((p) => ({ ...p, targetBasis: e.target.value }))} style={{ width: 200 }}>
              <option value="real">現在価値(実質・インフレ調整後)</option>
              <option value="nominal">名目(将来時点の金額そのまま)</option>
            </select>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="ip-stat-label">達成度</div>
          <div className="ip-stat-value" style={{ color: "var(--tsumitate)" }}>{pct.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
        {Array.from({ length: blocks }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 14, borderRadius: 3, background: i < filled ? "var(--tsumitate)" : "#E7E9E2" }} />
        ))}
      </div>
      <div className="ip-note">
        現在資産 {manYen(currentTotalAssets)} / 目標 {manYen(profile.targetAmount)}(あと{manYen(remainingAmount)})
        {achievement
          ? `　→　現在のプランでは ${achievement.age}歳(${achievement.year}年、あと${remainingYears}年) で目標到達見込みです。`
          : `　→　現在の入力期間内では目標に到達しません。積立プランのタブで投資額を増やすか期間を延ばしてください。`}
      </div>
    </div>
  );
}

export default memo(GoalCard);
