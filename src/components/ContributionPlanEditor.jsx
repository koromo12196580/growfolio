import React from "react";
import MoneyInput from "./inputs/MoneyInput.jsx";
import AgeSelect from "./inputs/AgeSelect.jsx";
import { BUCKETS } from "../constants.js";

// 「毎月の積立設定」の登録一覧+追加/反映ボタン。前提条件カードから切り出したコンポーネント。
export default function ContributionPlanEditor({ plans, onAdd, onUpdate, onRemove, onApply }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>毎月の積立設定</div>
      <div className="ip-note" style={{ marginBottom: 10 }}>
        積立先・毎月の金額・積立期間(年齢)を登録し、「積立設定を反映」を押すと下の「積立プラン」表の年間投資額へ自動入力されます。
        反映は、設定でカバーされている年齢・積立先のセルだけを上書きします。カバーされていない年齢・積立先の手入力値はそのまま残ります。
        同じ積立先・年齢が複数の設定と重なる場合は合算されます。
      </div>
      {plans.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {plans.map((p) => (
            <div key={p.id} className="ip-plan-row">
              <select
                className="ip-select" style={{ width: "auto", minWidth: 160 }}
                value={p.bucket}
                onChange={(e) => onUpdate(p.id, "bucket", e.target.value)}
              >
                {BUCKETS.map((b) => (
                  <option key={b.key} value={b.key}>{b.label}</option>
                ))}
              </select>
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>月額</span>
              <MoneyInput style={{ width: 130 }} value={p.monthlyAmount} onChange={(v) => onUpdate(p.id, "monthlyAmount", v)} />
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>円/月</span>
              <AgeSelect style={{ width: "auto", minWidth: 90 }} value={p.startAge} onChange={(v) => onUpdate(p.id, "startAge", v)} />
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>〜</span>
              <AgeSelect style={{ width: "auto", minWidth: 90 }} value={p.endAge} onChange={(v) => onUpdate(p.id, "endAge", v)} />
              <button className="ip-btn ip-btn-ghost" style={{ fontSize: 12, padding: "6px 12px", marginLeft: "auto" }} onClick={() => onRemove(p.id)}>
                削除
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button className="ip-btn ip-btn-ghost" onClick={onAdd}>＋積立設定を追加</button>
        <button className="ip-btn" disabled={plans.length === 0} onClick={onApply}>積立設定を反映</button>
      </div>
    </div>
  );
}
