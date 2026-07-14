import React, { memo } from "react";
import MoneyInput from "./inputs/MoneyInput.jsx";
import { BUCKETS } from "../constants.js";
import { sumBucketField } from "../utils/bucketUtils.js";
import { computeRowMax, computeAchievementPct } from "../utils/simulate.js";
import { yen } from "../utils/format.js";

// 積立プラン表の1行分。React.memoで包み、rowとaccの参照が変わらない限り再レンダリングをスキップする。
// updateRowはApp側でuseCallbackにより安定した参照になっているため、
// 「ある年の入力を変えても、その影響を受けない他の年の行は再描画されない」という最適化が効く
// (複利計算の性質上、編集した年より前の行は影響を受けないため実際にスキップされる)。
function PlanRow({ row, acc, assumptions, currentAge, targetAmount, targetBasis, inflationRate, updateRow }) {
  const warn = acc && (BUCKETS.some((b) => acc[b.key + "OverAnnual"]) || acc.nisaLifetimeOver || acc.nisaGrowthLifetimeOver);
  const rowTotal = sumBucketField(row, "");
  const pct = acc ? computeAchievementPct(acc.total, acc.age, currentAge, targetAmount, targetBasis, inflationRate) : null;
  const achieved = pct != null && pct >= 100;

  return (
    <tr className={warn ? "ip-row-warn" : achieved ? "ip-row-achieved" : ""}>
      <td>{row.year}年 / {row.age}歳</td>
      {BUCKETS.map((b) => (
        <td key={b.key}>
          <MoneyInput
            value={row[b.key]}
            onChange={(v) => updateRow(row.age, b.key, v)}
            max={acc ? computeRowMax(b.key, assumptions, acc.priorNisaLifetimeUsed, acc.priorNisaGrowthUsed) : undefined}
          />
        </td>
      ))}
      <td style={{ fontFamily: "var(--mono)" }}>{yen(rowTotal)}</td>
      <td style={{ fontFamily: "var(--mono)", color: "var(--tsumitate)" }}>{acc ? yen(acc.totalGain) : "-"}</td>
      <td style={{ fontFamily: "var(--mono)", color: "var(--growth)" }}>{acc ? yen(acc.total) : "-"}</td>
      <td style={{ fontFamily: "var(--mono)", color: achieved ? "var(--tsumitate)" : "var(--muted)", fontWeight: achieved ? 700 : 400 }}>
        {pct != null ? pct.toFixed(1) + "%" : "-"}
      </td>
    </tr>
  );
}

export default memo(PlanRow);
