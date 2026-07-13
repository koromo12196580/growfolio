import React from "react";
import { Settings2, AlertTriangle } from "lucide-react";
import MoneyInput from "./inputs/MoneyInput.jsx";
import AgeSelect from "./inputs/AgeSelect.jsx";
import PercentSelect from "./inputs/PercentSelect.jsx";
import ContributionPlanEditor from "./ContributionPlanEditor.jsx";

// 「前提条件」カード全体。現在資産・毎月の積立設定・年齢利回り前提・NISA/iDeCo上限をまとめる。
export default function SettingsPanel({
  profile, setProfile, assumptions, setAssumptions,
  contributionPlans, onAddPlan, onUpdatePlan, onRemovePlan, onApplyPlans,
}) {
  return (
    <div className="ip-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Settings2 size={16} style={{ color: "var(--navy)" }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>前提条件</div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>現在の資産(初期残高)</div>
      <div className="ip-grid ip-grid-3" style={{ marginBottom: 16 }}>
        <div>
          <label className="ip-input-label">特定口座</label>
          <MoneyInput value={profile.initialTaxable} onChange={(v) => setProfile((p) => ({ ...p, initialTaxable: v }))} />
        </div>
        <div>
          <label className="ip-input-label">つみたて投資枠(NISA)</label>
          <MoneyInput value={profile.initialTsumitate} onChange={(v) => setProfile((p) => ({ ...p, initialTsumitate: v }))} />
        </div>
        <div>
          <label className="ip-input-label">成長投資枠(NISA)</label>
          <MoneyInput value={profile.initialGrowth} onChange={(v) => setProfile((p) => ({ ...p, initialGrowth: v }))} />
        </div>
        <div>
          <label className="ip-input-label">iDeCo</label>
          <MoneyInput value={profile.initialIdeco} onChange={(v) => setProfile((p) => ({ ...p, initialIdeco: v }))} />
        </div>
        <div>
          <label className="ip-input-label">企業型年金</label>
          <MoneyInput value={profile.initialKigyoNenkin} onChange={(v) => setProfile((p) => ({ ...p, initialKigyoNenkin: v }))} />
        </div>
      </div>

      <ContributionPlanEditor
        plans={contributionPlans}
        onAdd={onAddPlan}
        onUpdate={onUpdatePlan}
        onRemove={onRemovePlan}
        onApply={onApplyPlans}
      />

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>年齢・利回りの前提</div>
      <div className="ip-grid ip-grid-3" style={{ marginBottom: 16 }}>
        <div>
          <label className="ip-input-label">現在の年齢</label>
          <AgeSelect value={profile.currentAge} onChange={(v) => setProfile((p) => ({ ...p, currentAge: v }))} />
        </div>
        <div>
          <label className="ip-input-label">取り崩し開始年齢(年齢指定の場合)</label>
          <AgeSelect value={profile.withdrawalStartAge} onChange={(v) => setProfile((p) => ({ ...p, withdrawalStartAge: v }))} />
        </div>
        <div>
          <label className="ip-input-label">資産寿命の想定年齢(何歳まで見るか)</label>
          <AgeSelect value={profile.horizonAge} onChange={(v) => setProfile((p) => ({ ...p, horizonAge: v }))} />
        </div>
        <div>
          <label className="ip-input-label">積立期の想定利回り(年率)</label>
          <PercentSelect value={assumptions.returnRate} onChange={(v) => setAssumptions((a) => ({ ...a, returnRate: v }))} />
        </div>
        <div>
          <label className="ip-input-label">取り崩し期の想定利回り(年率)</label>
          <PercentSelect value={assumptions.withdrawalReturnRate} onChange={(v) => setAssumptions((a) => ({ ...a, withdrawalReturnRate: v }))} />
        </div>
        <div>
          <label className="ip-input-label">インフレ率(年率)</label>
          <PercentSelect value={assumptions.inflationRate} onChange={(v) => setAssumptions((a) => ({ ...a, inflationRate: v }))} />
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>NISA・iDeCo・企業型年金の年間投資上限</div>
      <div className="ip-grid ip-grid-3">
        <div>
          <label className="ip-input-label">つみたて投資枠 年間上限</label>
          <MoneyInput value={assumptions.tsumitateAnnualLimit} onChange={(v) => setAssumptions((a) => ({ ...a, tsumitateAnnualLimit: v }))} />
        </div>
        <div>
          <label className="ip-input-label">成長投資枠 年間上限</label>
          <MoneyInput value={assumptions.growthAnnualLimit} onChange={(v) => setAssumptions((a) => ({ ...a, growthAnnualLimit: v }))} />
        </div>
        <div>
          <label className="ip-input-label">NISA生涯非課税限度額(合計)</label>
          <MoneyInput value={assumptions.lifetimeLimit} onChange={(v) => setAssumptions((a) => ({ ...a, lifetimeLimit: v }))} />
        </div>
        <div>
          <label className="ip-input-label">うち成長投資枠の生涯上限</label>
          <MoneyInput value={assumptions.lifetimeGrowthLimit} onChange={(v) => setAssumptions((a) => ({ ...a, lifetimeGrowthLimit: v }))} />
        </div>
        <div>
          <label className="ip-input-label">iDeCo 年間上限(職業により異なります)</label>
          <MoneyInput value={assumptions.idecoAnnualLimit} onChange={(v) => setAssumptions((a) => ({ ...a, idecoAnnualLimit: v }))} />
        </div>
        <div>
          <label className="ip-input-label">企業型年金 年間上限(規約により異なります)</label>
          <MoneyInput value={assumptions.kigyoAnnualLimit} onChange={(v) => setAssumptions((a) => ({ ...a, kigyoAnnualLimit: v }))} />
        </div>
      </div>
      <div className="ip-note" style={{ marginTop: 10 }}>
        NISAは2024年開始の新制度(2026年時点)の数値を初期値にしています。iDeCo・企業型年金の上限はご自身の職業や企業年金の有無によって異なるため、該当する金額に書き換えてください。制度は今後改正される可能性があります。
      </div>
      {profile.withdrawalStartAge <= profile.currentAge && (
        <div className="ip-warning-box">
          <AlertTriangle size={16} />
          取り崩し開始年齢は現在の年齢より後にしてください。現在の設定では積立期間がありません。
        </div>
      )}
      {profile.horizonAge < profile.withdrawalStartAge && (
        <div className="ip-warning-box">
          <AlertTriangle size={16} />
          資産寿命の想定年齢は取り崩し開始年齢以降にしてください。現在の設定では取り崩し期間がありません。
        </div>
      )}
    </div>
  );
}
