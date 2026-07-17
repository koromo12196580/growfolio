import React, { useMemo } from "react";
import MoneyInput from "./inputs/MoneyInput.jsx";
import AgeSelect from "./inputs/AgeSelect.jsx";
import PercentSelect from "./inputs/PercentSelect.jsx";
import { MIN_AGE, MAX_AGE } from "../constants.js";
import { monthlyContributionFutureValue } from "../utils/calculators.js";
import { yen, manYen } from "../utils/format.js";

// ①かんたんシミュレーション。初回アクセス時に表示するシンプルな入力画面。
// 5項目だけ入力すればリアルタイムに将来資産・達成率・達成年齢が分かるようにしてある。
// 詳細な年ごとのプラン(rows)は一切触らず、utils/calculators.js の純粋関数だけで計算するため、
// 既存の詳細シミュレーションのロジックには影響しない。
const MAX_PROJECTION_YEARS = Math.max(1, MAX_AGE - MIN_AGE);

export default function SimpleSimulator({ onGoDetailed }) {
  const [currentAge, setCurrentAge] = React.useState(30);
  const [initialAssets, setInitialAssets] = React.useState(0);
  const [monthlyContribution, setMonthlyContribution] = React.useState(50000);
  const [returnRate, setReturnRate] = React.useState(0.05);
  const [targetAmount, setTargetAmount] = React.useState(30000000);

  const result = useMemo(() => {
    const maxYears = Math.min(MAX_PROJECTION_YEARS, MAX_AGE - currentAge);
    let achievedYear = null;
    for (let y = 1; y <= maxYears; y++) {
      const { futureValue } = monthlyContributionFutureValue(initialAssets, monthlyContribution, returnRate, y);
      if (futureValue >= targetAmount) { achievedYear = y; break; }
    }
    const referenceYears = achievedYear || maxYears;
    const { futureValue, principal, gain } = monthlyContributionFutureValue(initialAssets, monthlyContribution, returnRate, referenceYears);
    const achievementRate = targetAmount > 0 ? (futureValue / targetAmount) * 100 : 0;
    const achievementAge = achievedYear ? currentAge + achievedYear : null;
    const diff = targetAmount - futureValue; // 正=不足、負=超過

    return {
      futureValue, principal, gain, achievementRate, achievementAge,
      remainingYears: achievedYear, referenceYears, diff,
    };
  }, [currentAge, initialAssets, monthlyContribution, returnRate, targetAmount]);

  return (
    <div>
      <div className="ip-card">
        <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
          かんたんシミュレーション
        </div>
        <div className="ip-note" style={{ marginBottom: 16 }}>
          5項目を入力するだけで、将来資産とFIRE目標までの見込みがすぐに分かります。
        </div>

        <div className="ip-grid ip-grid-3" style={{ marginBottom: 4 }}>
          <div>
            <label className="ip-input-label">現在年齢</label>
            <AgeSelect value={currentAge} onChange={setCurrentAge} />
          </div>
          <div>
            <label className="ip-input-label">初期資産</label>
            <MoneyInput value={initialAssets} onChange={setInitialAssets} />
          </div>
          <div>
            <label className="ip-input-label">毎月積立額</label>
            <MoneyInput value={monthlyContribution} onChange={setMonthlyContribution} />
          </div>
          <div>
            <label className="ip-input-label">想定年利</label>
            <PercentSelect value={returnRate} onChange={setReturnRate} />
          </div>
          <div>
            <label className="ip-input-label">目標資産</label>
            <MoneyInput value={targetAmount} onChange={setTargetAmount} />
          </div>
        </div>
      </div>

      <div className="ip-card" style={{ background: "#F7F8F4" }}>
        <div className="ip-grid ip-grid-3">
          <div>
            <div className="ip-stat-label">将来資産({result.referenceYears}年後・{currentAge + result.referenceYears}歳時点)</div>
            <div className="ip-stat-value">{yen(result.futureValue)}</div>
          </div>
          <div>
            <div className="ip-stat-label">目標達成率</div>
            <div className="ip-stat-value" style={{ color: "var(--tsumitate)" }}>{result.achievementRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="ip-stat-label">目標達成年齢</div>
            <div className="ip-stat-value">
              {result.achievementAge != null ? `${result.achievementAge}歳` : `${MAX_AGE}歳までに未達成`}
            </div>
          </div>
          <div>
            <div className="ip-stat-label">あと何年</div>
            <div className="ip-stat-value">{result.remainingYears != null ? `あと${result.remainingYears}年` : "-"}</div>
          </div>
          <div>
            <div className="ip-stat-label">{result.diff > 0 ? "目標まであといくら不足" : "目標に対する超過額"}</div>
            <div className="ip-stat-value" style={{ color: result.diff > 0 ? "var(--warn)" : "var(--tsumitate)" }}>
              {manYen(Math.abs(result.diff))}
            </div>
          </div>
          <div>
            <div className="ip-stat-label">元本 / 運用益</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 14 }}>{manYen(result.principal)} / <span style={{ color: "var(--tsumitate)" }}>{manYen(result.gain)}</span></div>
          </div>
        </div>
      </div>

      <div className="ip-card" style={{ textAlign: "center" }}>
        <div className="ip-note" style={{ marginBottom: 12 }}>
          NISA・iDeCo・企業型年金の使い分けや、取り崩し方法まで細かく設定したい方はこちら
        </div>
        <button
          className="ip-btn"
          style={{ fontSize: 15, padding: "12px 28px" }}
          onClick={() => onGoDetailed({ currentAge, initialAssets, monthlyContribution, returnRate, targetAmount })}
        >
          詳細シミュレーションへ →
        </button>
      </div>
    </div>
  );
}
