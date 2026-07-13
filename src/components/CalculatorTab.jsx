import React, { useState } from "react";
import MoneyInput from "./inputs/MoneyInput.jsx";
import PercentSelect from "./inputs/PercentSelect.jsx";
import IntegerSelect from "./inputs/IntegerSelect.jsx";
import { yen, manYen } from "../utils/format.js";
import {
  compoundInterest, monthlyContributionFutureValue, fireRequiredAssets, fourPercentRule,
  requiredMonthlyContribution, inflationAdjust, solveRequiredRate,
} from "../utils/calculators.js";

const CALCULATORS = [
  { id: "compound", label: "① 複利計算" },
  { id: "monthly", label: "② 毎月積立計算" },
  { id: "fire", label: "③ FIRE必要資産" },
  { id: "fourPercent", label: "④ 4%ルール" },
  { id: "reverseMonthly", label: "⑤ 積立額の逆算" },
  { id: "inflation", label: "⑥ インフレ調整" },
  { id: "reverseRate", label: "⑦ 利回り逆算" },
];

function ResultCard({ children }) {
  return (
    <div className="ip-card" style={{ background: "#F7F8F4" }}>
      <div className="ip-stat-label">結果</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="ip-input-label">{label}</label>
      {children}
    </div>
  );
}

function CompoundInterestCalc() {
  const [principal, setPrincipal] = useState(1000000);
  const [rate, setRate] = useState(0.05);
  const [years, setYears] = useState(10);
  const { futureValue, gain } = compoundInterest(principal, rate, years);
  return (
    <div>
      <div className="ip-grid ip-grid-3" style={{ marginBottom: 16 }}>
        <Field label="元本"><MoneyInput value={principal} onChange={setPrincipal} /></Field>
        <Field label="年利回り"><PercentSelect value={rate} onChange={setRate} /></Field>
        <Field label="運用年数"><IntegerSelect value={years} onChange={setYears} min={1} max={70} unit="年" /></Field>
      </div>
      <ResultCard>
        <div className="ip-stat-value">{yen(futureValue)}</div>
        <div className="ip-note">うち運用益 {yen(gain)}</div>
      </ResultCard>
    </div>
  );
}

function MonthlyContributionCalc() {
  const [initial, setInitial] = useState(0);
  const [monthly, setMonthly] = useState(50000);
  const [rate, setRate] = useState(0.05);
  const [years, setYears] = useState(20);
  const { futureValue, principal, gain } = monthlyContributionFutureValue(initial, monthly, rate, years);
  return (
    <div>
      <div className="ip-grid ip-grid-3" style={{ marginBottom: 16 }}>
        <Field label="初期資産"><MoneyInput value={initial} onChange={setInitial} /></Field>
        <Field label="毎月の積立額"><MoneyInput value={monthly} onChange={setMonthly} /></Field>
        <Field label="年利回り"><PercentSelect value={rate} onChange={setRate} /></Field>
        <Field label="積立年数"><IntegerSelect value={years} onChange={setYears} min={1} max={70} unit="年" /></Field>
      </div>
      <ResultCard>
        <div className="ip-stat-value">{yen(futureValue)}</div>
        <div className="ip-note">元本合計 {yen(principal)} / うち運用益 {yen(gain)}</div>
      </ResultCard>
    </div>
  );
}

function FireRequiredAssetsCalc() {
  const [annualExpense, setAnnualExpense] = useState(3000000);
  const [rate, setRate] = useState(0.04);
  const required = fireRequiredAssets(annualExpense, rate);
  return (
    <div>
      <div className="ip-grid ip-grid-3" style={{ marginBottom: 16 }}>
        <Field label="年間支出"><MoneyInput value={annualExpense} onChange={setAnnualExpense} /></Field>
        <Field label="想定取り崩し率"><PercentSelect value={rate} onChange={setRate} maxPercent={10} /></Field>
      </div>
      <ResultCard>
        <div className="ip-stat-value">{required != null ? yen(required) : "-"}</div>
        <div className="ip-note">この資産があれば、年{(rate * 100).toFixed(1)}%の取り崩しで年間支出をまかなえる計算です。</div>
      </ResultCard>
    </div>
  );
}

function FourPercentRuleCalc() {
  const [assets, setAssets] = useState(100000000);
  const [rate, setRate] = useState(0.04);
  const { annual, monthly } = fourPercentRule(assets, rate);
  return (
    <div>
      <div className="ip-grid ip-grid-3" style={{ marginBottom: 16 }}>
        <Field label="資産額"><MoneyInput value={assets} onChange={setAssets} /></Field>
        <Field label="取り崩し率"><PercentSelect value={rate} onChange={setRate} maxPercent={10} /></Field>
      </div>
      <ResultCard>
        <div className="ip-stat-value">{yen(annual)} / 年</div>
        <div className="ip-note">月あたり {yen(monthly)}</div>
      </ResultCard>
    </div>
  );
}

function ReverseMonthlyCalc() {
  const [target, setTarget] = useState(30000000);
  const [initial, setInitial] = useState(0);
  const [rate, setRate] = useState(0.05);
  const [years, setYears] = useState(20);
  const monthly = requiredMonthlyContribution(target, initial, rate, years);
  return (
    <div>
      <div className="ip-grid ip-grid-3" style={{ marginBottom: 16 }}>
        <Field label="目標金額"><MoneyInput value={target} onChange={setTarget} /></Field>
        <Field label="初期資産"><MoneyInput value={initial} onChange={setInitial} /></Field>
        <Field label="年利回り"><PercentSelect value={rate} onChange={setRate} /></Field>
        <Field label="積立年数"><IntegerSelect value={years} onChange={setYears} min={1} max={70} unit="年" /></Field>
      </div>
      <ResultCard>
        <div className="ip-stat-value">{yen(monthly)} / 月</div>
        <div className="ip-note">この毎月積立額なら、{years}年後に目標金額に到達する計算です。</div>
      </ResultCard>
    </div>
  );
}

function InflationAdjustCalc() {
  const [amount, setAmount] = useState(3000000);
  const [rate, setRate] = useState(0.02);
  const [years, setYears] = useState(20);
  const [direction, setDirection] = useState("toFuture");
  const result = inflationAdjust(amount, rate, years, direction);
  return (
    <div>
      <div className="ip-grid ip-grid-3" style={{ marginBottom: 16 }}>
        <Field label="計算方向">
          <select className="ip-select" value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="toFuture">現在の金額 → 将来の名目金額</option>
            <option value="toPresent">将来の金額 → 現在価値</option>
          </select>
        </Field>
        <Field label="金額"><MoneyInput value={amount} onChange={setAmount} /></Field>
        <Field label="インフレ率"><PercentSelect value={rate} onChange={setRate} maxPercent={10} /></Field>
        <Field label="年数"><IntegerSelect value={years} onChange={setYears} min={1} max={70} unit="年" /></Field>
      </div>
      <ResultCard>
        <div className="ip-stat-value">{yen(result)}</div>
        <div className="ip-note">
          {direction === "toFuture"
            ? `現在の${manYen(amount)}と同じ購買力を${years}年後に持つには、名目でこの金額が必要という計算です。`
            : `${years}年後の${manYen(amount)}は、現在の価値に換算するとこの金額に相当します。`}
        </div>
      </ResultCard>
    </div>
  );
}

function ReverseRateCalc() {
  const [initial, setInitial] = useState(1000000);
  const [monthly, setMonthly] = useState(50000);
  const [years, setYears] = useState(20);
  const [target, setTarget] = useState(30000000);
  const rate = solveRequiredRate(initial, monthly, years, target);
  return (
    <div>
      <div className="ip-grid ip-grid-3" style={{ marginBottom: 16 }}>
        <Field label="初期資産"><MoneyInput value={initial} onChange={setInitial} /></Field>
        <Field label="毎月の積立額"><MoneyInput value={monthly} onChange={setMonthly} /></Field>
        <Field label="年数"><IntegerSelect value={years} onChange={setYears} min={1} max={70} unit="年" /></Field>
        <Field label="目標金額"><MoneyInput value={target} onChange={setTarget} /></Field>
      </div>
      <ResultCard>
        {rate == null ? (
          <div className="ip-note" style={{ color: "var(--warn)" }}>現実的な利回り(-50%〜100%)の範囲では到達できません。積立額や年数を見直してください。</div>
        ) : (
          <>
            <div className="ip-stat-value">年率 {(rate * 100).toFixed(2)}%</div>
            <div className="ip-note">この利回りで運用できれば、{years}年後に目標金額に到達する計算です。</div>
          </>
        )}
      </ResultCard>
    </div>
  );
}

const CALCULATOR_COMPONENTS = {
  compound: CompoundInterestCalc,
  monthly: MonthlyContributionCalc,
  fire: FireRequiredAssetsCalc,
  fourPercent: FourPercentRuleCalc,
  reverseMonthly: ReverseMonthlyCalc,
  inflation: InflationAdjustCalc,
  reverseRate: ReverseRateCalc,
};

export default function CalculatorTab() {
  const [active, setActive] = useState("compound");
  const Active = CALCULATOR_COMPONENTS[active];
  return (
    <div>
      <div className="ip-card">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CALCULATORS.map((c) => (
            <button
              key={c.id}
              className={active === c.id ? "ip-btn" : "ip-btn ip-btn-ghost"}
              style={{ fontSize: 12.5 }}
              onClick={() => setActive(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ip-card">
        <Active />
      </div>
    </div>
  );
}
