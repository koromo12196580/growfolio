import React from "react";
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { BUCKETS } from "../constants.js";
import { sumBucketField } from "../utils/bucketUtils.js";
import { yen, manYen } from "../utils/format.js";

export default function GrowthTab({ chartData, lastAcc, withdrawalStartAge, achievement }) {
  const totalGain = sumBucketField(lastAcc, "Balance") - sumBucketField(lastAcc, "Principal");
  const totalBalance = sumBucketField(lastAcc, "Balance");
  return (
    <div>
      <div className="ip-grid ip-grid-3">
        <div className="ip-card">
          <div className="ip-stat-label">取り崩し開始時点({withdrawalStartAge}歳)の資産合計</div>
          <div className="ip-stat-value">{yen(totalBalance)}</div>
        </div>
        <div className="ip-card">
          <div className="ip-stat-label">うち運用益</div>
          <div className="ip-stat-value" style={{ color: "var(--tsumitate)" }}>{yen(totalGain)}</div>
        </div>
        <div className="ip-card">
          <div className="ip-stat-label">口座別内訳</div>
          <div style={{ fontSize: 12.5, fontFamily: "var(--mono)", marginTop: 4, lineHeight: 1.9 }}>
            {BUCKETS.map((b) => (
              <div key={b.key}>{b.label}: {manYen(lastAcc[b.key + "Balance"])}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="ip-card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>資産推移(積立期 → 取り崩し期)- 元本と運用益の内訳</div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#E5E7E0" strokeDasharray="3 3" />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: "年齢", position: "insideBottom", offset: -3, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => manYen(v)} width={80} />
            <Tooltip formatter={(v) => yen(v)} labelFormatter={(l) => l + "歳"} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="元本" stackId="1" stroke="var(--growth)" fill="var(--growth)" fillOpacity={0.3} />
            <Area type="monotone" dataKey="運用益" stackId="1" stroke="var(--tsumitate)" fill="var(--tsumitate)" fillOpacity={0.4} />
            <ReferenceLine x={withdrawalStartAge} stroke="var(--warn)" strokeDasharray="4 4"
              label={{ value: "取り崩し開始", position: "top", fill: "var(--warn)", fontSize: 11 }} />
            {achievement && (
              <ReferenceLine x={achievement.age} stroke="var(--tsumitate)" strokeDasharray="2 2"
                label={{ value: "目標到達", position: "insideTopRight", fill: "var(--tsumitate)", fontSize: 11 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
