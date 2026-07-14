import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import NisaUsageCard from "./NisaUsageCard.jsx";
import AllocationPieChart from "./AllocationPieChart.jsx";
import PlanRow from "./PlanRow.jsx";
import { BUCKETS } from "../constants.js";
import { sumBucketField } from "../utils/bucketUtils.js";
import { yen } from "../utils/format.js";

export default function PlanTab({
  rows, updateRow, assumptions, accResults, totalContribution, nisaLifetimeUsed, nisaGrowthUsed,
  currentAge, currentYear, initialBalances, targetAmount, targetBasis, inflationRate, currentTotalAssets, onClearContributions,
}) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const hasInitial = sumBucketField(initialBalances, "") > 0;
  const principalTotal = currentTotalAssets + totalContribution;

  const pieData = BUCKETS.map((b) => ({ name: b.label, value: initialBalances[b.key] || 0, color: b.color }));

  return (
    <div>
      <div className="ip-grid ip-grid-3">
        <div className="ip-card">
          <div className="ip-stat-label">現在資産(初期入力)</div>
          <div className="ip-stat-value">{yen(currentTotalAssets)}</div>
        </div>
        <div className="ip-card">
          <div className="ip-stat-label">元本合計(現在資産+累計投資額)</div>
          <div className="ip-stat-value">{yen(principalTotal)}</div>
        </div>
        <NisaUsageCard title="NISA生涯枠" used={nisaLifetimeUsed} limit={assumptions.lifetimeLimit} color="var(--tsumitate)" />
        <NisaUsageCard title="成長投資枠(生涯)" used={nisaGrowthUsed} limit={assumptions.lifetimeGrowthLimit} color="var(--growth)" />
      </div>

      <AllocationPieChart title="現在資産の内訳" data={pieData} />

      <div className="ip-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {BUCKETS.map((b) => (
              <span key={b.key} className={"ip-badge " + b.badgeClass}>{b.label}</span>
            ))}
          </div>
          {!confirmingClear ? (
            <button className="ip-btn ip-btn-ghost" onClick={() => setConfirmingClear(true)}>
              積立金額をクリア
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, color: "var(--warn)" }}>積立金額をすべて0にしますか?</span>
              <button
                className="ip-btn"
                style={{ background: "var(--warn)" }}
                onClick={() => { onClearContributions(); setConfirmingClear(false); }}
              >
                はい、クリアする
              </button>
              <button className="ip-btn ip-btn-ghost" onClick={() => setConfirmingClear(false)}>
                キャンセル
              </button>
            </div>
          )}
        </div>
        <div className="ip-note" style={{ marginBottom: 10 }}>
          年ごとに金額を自由に変更できます。ボーナスでの増額や単発の臨時投資も、その年の金額に加えて入力してください。NISA/iDeCo/企業型年金は年間上限を超える金額は入力できません。「年末資産残高」と「目標達成度」は、想定利回りで運用した結果です。
        </div>
        <div className="ip-table-wrap">
          <table className="ip-table">
            <thead>
              <tr>
                <th>年 / 年齢</th>
                {BUCKETS.map((b) => <th key={b.key}>{b.label}</th>)}
                <th>年間投資額</th>
                <th>運用益</th>
                <th>年末資産残高</th>
                <th>目標達成度</th>
              </tr>
            </thead>
            <tbody>
              {hasInitial && (
                <tr className="ip-initial-row">
                  <td>{currentYear}年 / {currentAge}歳(期首残高)</td>
                  {BUCKETS.map((b) => <td key={b.key}>{yen(initialBalances[b.key])}</td>)}
                  <td>{yen(sumBucketField(initialBalances, ""))}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              )}
              {rows.map((r, i) => (
                <PlanRow
                  key={r.age}
                  row={r}
                  acc={accResults[i]}
                  assumptions={assumptions}
                  currentAge={currentAge}
                  targetAmount={targetAmount}
                  targetBasis={targetBasis}
                  inflationRate={inflationRate}
                  updateRow={updateRow}
                />
              ))}
            </tbody>
          </table>
        </div>
        {(Math.round(nisaLifetimeUsed) > Math.round(assumptions.lifetimeLimit) || Math.round(nisaGrowthUsed) > Math.round(assumptions.lifetimeGrowthLimit)) && (
          <div className="ip-warning-box">
            <AlertTriangle size={16} />
            <span>NISAの非課税保有限度額(生涯枠)を超える入力があります。該当年の行が薄い赤色で表示されています。</span>
          </div>
        )}
      </div>
    </div>
  );
}
