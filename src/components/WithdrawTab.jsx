import React from "react";
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";
import MoneyInput from "./inputs/MoneyInput.jsx";
import AgeSelect from "./inputs/AgeSelect.jsx";
import RateInput from "./inputs/RateInput.jsx";
import AllocationPieChart from "./AllocationPieChart.jsx";
import { BUCKETS } from "../constants.js";
import { sumBucketField } from "../utils/bucketUtils.js";
import { yen, manYen } from "../utils/format.js";

export default function WithdrawTab({
  settings, setSettings, profile, setProfile, withdrawResult, lastAcc,
  withdrawalStartAge, amountTriggerNotReached, chartData,
}) {
  const totalBalance = sumBucketField(lastAcc, "Balance");
  const withdrawChartData = chartData.filter((d) => d.phase === "取り崩し期");
  const pieData = BUCKETS.map((b) => ({ name: b.label, value: lastAcc[b.key + "Balance"] || 0, color: b.color }));

  return (
    <div>
      <div className="ip-card">
        <div className="ip-grid ip-grid-3">
          <div>
            <label className="ip-input-label">取り崩し開始条件</label>
            <select className="ip-select" value={settings.triggerType} onChange={(e) => setSettings((s) => ({ ...s, triggerType: e.target.value }))}>
              <option value="age">年齢に達したら開始</option>
              <option value="amount">資産額が目標に達したら開始</option>
            </select>
          </div>
          {settings.triggerType === "age" ? (
            <div>
              <label className="ip-input-label">取り崩し開始年齢</label>
              <AgeSelect value={profile.withdrawalStartAge} onChange={(v) => setProfile((p) => ({ ...p, withdrawalStartAge: v }))} />
            </div>
          ) : (
            <div>
              <label className="ip-input-label">開始のトリガーとなる資産額(名目)</label>
              <MoneyInput value={settings.triggerAmount} onChange={(v) => setSettings((s) => ({ ...s, triggerAmount: v }))} />
            </div>
          )}
          <div>
            <label className="ip-input-label">取り崩し方法</label>
            <select className="ip-select" value={settings.method} onChange={(e) => setSettings((s) => ({ ...s, method: e.target.value }))}>
              <option value="rate">定率(残高の%を毎年取り崩す)</option>
              <option value="fixed">定額(毎年一定額を取り崩す)</option>
              <option value="target">目標年齢までに使い切る</option>
            </select>
          </div>
          {settings.method === "rate" && (
            <div>
              <label className="ip-input-label">取り崩し率(年率)</label>
              <RateInput value={settings.rate} onChange={(v) => setSettings((s) => ({ ...s, rate: v }))} />
            </div>
          )}
          {settings.method === "fixed" && (
            <div>
              <label className="ip-input-label">毎年の取り崩し額</label>
              <MoneyInput value={settings.fixedAmount} onChange={(v) => setSettings((s) => ({ ...s, fixedAmount: v }))} />
            </div>
          )}
          {settings.method === "target" && (
            <div>
              <label className="ip-input-label">使い切りたい年齢</label>
              <AgeSelect value={settings.targetAge} onChange={(v) => setSettings((s) => ({ ...s, targetAge: v }))} />
            </div>
          )}
        </div>
        {amountTriggerNotReached && (
          <div className="ip-warning-box">
            <AlertTriangle size={16} />
            現在の積立プラン(年齢範囲)では設定した資産額に到達しません。「積立プラン」タブで期間を延ばすか投資額を増やすか、トリガー金額を見直してください。ここでは便宜的に積立最終年({profile.withdrawalStartAge}歳)の資産で計算しています。
          </div>
        )}
      </div>

      <div className="ip-grid ip-grid-3">
        <div className="ip-card">
          <div className="ip-stat-label">取り崩し開始({withdrawalStartAge}歳)時の資産</div>
          <div className="ip-stat-value">{yen(totalBalance)}</div>
        </div>
        <div className="ip-card">
          <div className="ip-stat-label">資産が尽きる年齢</div>
          <div className="ip-stat-value" style={{ color: withdrawResult.depletionAge ? "var(--warn)" : "var(--tsumitate)" }}>
            {withdrawResult.depletionAge ? withdrawResult.depletionAge + "歳" : profile.horizonAge + "歳時点で残あり"}
          </div>
        </div>
        <div className="ip-card">
          <div className="ip-stat-label">初年度の取り崩し額</div>
          <div className="ip-stat-value">{withdrawResult.rows[0] ? yen(withdrawResult.rows[0].withdrawal) : "-"}</div>
        </div>
      </div>

      <AllocationPieChart title="FIRE(取り崩し開始)時点の資産内訳" data={pieData} />

      <div className="ip-card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>取り崩し期の資産推移(投資額・運用益の内訳)</div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={withdrawChartData}>
            <CartesianGrid stroke="#E5E7E0" strokeDasharray="3 3" />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => manYen(v)} width={80} />
            <Tooltip formatter={(v) => yen(v)} labelFormatter={(l) => l + "歳"} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="元本" stackId="1" stroke="var(--growth)" fill="var(--growth)" fillOpacity={0.3} />
            <Area type="monotone" dataKey="運用益" stackId="1" stroke="var(--tsumitate)" fill="var(--tsumitate)" fillOpacity={0.4} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="ip-note" style={{ marginTop: 8 }}>
          取り崩しは特定口座・NISA・iDeCo・企業型年金の残高比率に応じて按分する想定の簡易計算です。実際にはiDeCoや企業型年金は原則60歳より前には引き出せず、受け取り時の税制も口座ごとに異なります。詳細な税務・受け取り方法は金融機関や専門家にご確認ください。
        </div>
      </div>
    </div>
  );
}
