import React, { useCallback, useEffect, useMemo, useState } from "react";

import { BUCKETS, CURRENT_YEAR, DEFAULT_ASSUMPTIONS, DEFAULT_PROFILE, DEFAULT_WITHDRAWAL_SETTINGS, TABS } from "./constants.js";
import { emptyBucketRow, regenerateRows, sumBucketField } from "./utils/bucketUtils.js";
import {
  simulateAccumulation, simulateWithdrawal, findAchievementPoint, clampRowsToLimits,
} from "./utils/simulate.js";

import { useAuth } from "./auth/AuthContext.jsx";
import ScenarioManager from "./components/ScenarioManager.jsx";
import GoalCard from "./components/GoalCard.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import PlanTab from "./components/PlanTab.jsx";
import GrowthTab from "./components/GrowthTab.jsx";
import WithdrawTab from "./components/WithdrawTab.jsx";
import CompareTab from "./components/CompareTab.jsx";
import CalculatorTab from "./components/CalculatorTab.jsx";
import NextStepsCard from "./components/NextStepsCard.jsx";
import ReportSection from "./components/ReportSection.jsx";
import AdviceCard from "./components/AdviceCard.jsx";
import AdBanner from "./components/ads/AdBanner.jsx";
import SimpleSimulator from "./components/SimpleSimulator.jsx";
import { initAnalytics, trackPageView, trackEvent } from "./utils/analytics.js";

export default function App() {
  const { user } = useAuth();
  const [mode, setMode] = useState("simple"); // "simple" = ①かんたんシミュレーション(初回表示) / "detailed" = 従来の詳細画面
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [rows, setRows] = useState(() => regenerateRows(DEFAULT_PROFILE.currentAge, DEFAULT_PROFILE.withdrawalStartAge, CURRENT_YEAR, []));
  const [withdrawalSettings, setWithdrawalSettings] = useState(DEFAULT_WITHDRAWAL_SETTINGS);
  const [tab, setTab] = useState("plan");

  // Google Analytics 4 の初期化(本番ビルドのみ)と、タブ切り替え=ページ遷移としての計測
  useEffect(() => {
    initAnalytics();
  }, []);
  useEffect(() => {
    if (mode === "simple") { trackPageView("/simple", "FireMap | かんたんシミュレーション"); return; }
    const current = TABS.find((t) => t.id === tab);
    trackPageView(`/${tab}`, current ? `FireMap | ${current.label}` : "FireMap");
  }, [mode, tab]);
  const [contributionPlans, setContributionPlans] = useState([]);

  // ---- 積立設定(毎月いくら×何歳〜何歳)のCRUDと、rowsへの反映 ----
  const addContributionPlan = useCallback(() => {
    setContributionPlans((prev) => [
      ...prev,
      {
        id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `plan-${Date.now()}-${Math.random()}`,
        bucket: "tsumitate", monthlyAmount: 0, startAge: profile.currentAge, endAge: profile.withdrawalStartAge,
      },
    ]);
  }, [profile.currentAge, profile.withdrawalStartAge]);

  const updateContributionPlan = useCallback((id, field, value) => {
    setContributionPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }, []);

  const removeContributionPlan = useCallback((id) => {
    setContributionPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // 「積立設定を反映」:設定でカバーされている(年齢, 積立先)だけをrowsへ書き込む。
  // カバーされていない年齢・積立先の手入力値はそのまま保持されるため、手入力と競合しない。
  const applyContributionPlans = useCallback(() => {
    setRows((prev) =>
      prev.map((r) => {
        const nr = { ...r };
        BUCKETS.forEach((b) => {
          const covering = contributionPlans.filter((p) => p.bucket === b.key && r.age >= p.startAge && r.age < p.endAge);
          if (covering.length > 0) nr[b.key] = covering.reduce((s, p) => s + (p.monthlyAmount || 0) * 12, 0);
        });
        return nr;
      })
    );
  }, [contributionPlans]);

  // 年齢範囲が変わったら行データを再生成(既存の値は年齢をキーに引き継ぐ)
  useEffect(() => {
    setRows((prev) => regenerateRows(profile.currentAge, profile.withdrawalStartAge, CURRENT_YEAR, prev));
  }, [profile.currentAge, profile.withdrawalStartAge]);

  // NISA生涯枠(初期資産分を含む)やiDeCo/企業型年金の年間上限が変わった場合、既存の入力値を新しい残り枠に合わせて即座にクランプする
  useEffect(() => {
    setRows((prev) => {
      const { rows: next, changed } = clampRowsToLimits(prev, assumptions, profile.initialTsumitate, profile.initialGrowth);
      return changed ? next : prev;
    });
  }, [
    assumptions.tsumitateAnnualLimit, assumptions.growthAnnualLimit, assumptions.idecoAnnualLimit, assumptions.kigyoAnnualLimit,
    assumptions.lifetimeLimit, assumptions.lifetimeGrowthLimit, profile.initialTsumitate, profile.initialGrowth,
  ]);

  const clearContributions = useCallback(() => {
    setRows((prev) => prev.map((r) => ({ ...r, ...emptyBucketRow() })));
  }, []);

  const updateRow = useCallback((age, field, value) => {
    setRows((prev) => prev.map((r) => (r.age === age ? { ...r, [field]: value } : r)));
  }, []);

  const initialBalances = useMemo(
    () => ({
      taxable: profile.initialTaxable, tsumitate: profile.initialTsumitate, growth: profile.initialGrowth,
      ideco: profile.initialIdeco, kigyoNenkin: profile.initialKigyoNenkin,
    }),
    [profile.initialTaxable, profile.initialTsumitate, profile.initialGrowth, profile.initialIdeco, profile.initialKigyoNenkin]
  );
  const currentTotalAssets = sumBucketField(initialBalances, "");

  const accResults = useMemo(() => simulateAccumulation(rows, assumptions, initialBalances), [rows, assumptions, initialBalances]);
  const lastAcc = useMemo(() => {
    if (accResults.length) return accResults[accResults.length - 1];
    const fallback = { total: currentTotalAssets, totalPrincipal: currentTotalAssets, totalGain: 0 };
    BUCKETS.forEach((b) => { fallback[b.key + "Balance"] = initialBalances[b.key]; fallback[b.key + "Principal"] = initialBalances[b.key]; });
    return fallback;
  }, [accResults, initialBalances, currentTotalAssets]);

  const achievement = useMemo(
    () => findAchievementPoint(accResults, profile.targetAmount, profile.targetBasis === "real", assumptions.inflationRate, profile.currentAge),
    [accResults, profile.targetAmount, profile.targetBasis, assumptions.inflationRate, profile.currentAge]
  );

  const amountTrigger = useMemo(
    () =>
      withdrawalSettings.triggerType === "amount"
        ? findAchievementPoint(accResults, withdrawalSettings.triggerAmount, false, assumptions.inflationRate, profile.currentAge)
        : null,
    [accResults, withdrawalSettings.triggerType, withdrawalSettings.triggerAmount, assumptions.inflationRate, profile.currentAge]
  );

  const withdrawalStartState = withdrawalSettings.triggerType === "amount" && amountTrigger ? amountTrigger : lastAcc;
  const withdrawalStartAge =
    withdrawalSettings.triggerType === "amount" ? (amountTrigger ? amountTrigger.age : profile.withdrawalStartAge) : profile.withdrawalStartAge;
  const amountTriggerNotReached = withdrawalSettings.triggerType === "amount" && !amountTrigger;

  const withdrawResult = useMemo(
    () => simulateWithdrawal(withdrawalStartState, { startAge: withdrawalStartAge, horizonAge: profile.horizonAge, ...withdrawalSettings }, assumptions),
    [withdrawalStartState, withdrawalStartAge, profile.horizonAge, withdrawalSettings, assumptions]
  );

  const totalContribution = rows.reduce((s, r) => s + sumBucketField(r, ""), 0);
  const nisaLifetimeUsed = accResults.length
    ? accResults[accResults.length - 1].nisaLifetimeUsed
    : initialBalances.tsumitate + initialBalances.growth;
  const nisaGrowthUsed = accResults.length ? accResults[accResults.length - 1].nisaGrowthUsed : initialBalances.growth;

  const pgChartData = useMemo(() => {
    const point = (r, phase) => ({
      age: r.age, phase,
      元本: Math.round(r.totalPrincipal),
      運用益: Math.round(Math.max(0, r.totalGain)),
      合計: Math.round(r.total),
    });
    return [...accResults.map((r) => point(r, "積立期")), ...withdrawResult.rows.map((r) => point(r, "取り崩し期"))];
  }, [accResults, withdrawResult]);

  // ---- 保存/読み込み ----
  const getCurrentData = useCallback(
    () => ({ profile, assumptions, rows, withdrawalSettings, contributionPlans }),
    [profile, assumptions, rows, withdrawalSettings, contributionPlans]
  );
  const handleLoadSimulation = useCallback((data) => {
    if (!data) return;
    setProfile({ ...DEFAULT_PROFILE, ...data.profile });
    setAssumptions({ ...DEFAULT_ASSUMPTIONS, ...data.assumptions });
    setRows(Array.isArray(data.rows) ? data.rows : []);
    setWithdrawalSettings({ ...DEFAULT_WITHDRAWAL_SETTINGS, ...data.withdrawalSettings });
    setContributionPlans(Array.isArray(data.contributionPlans) ? data.contributionPlans : []);
  }, []);

  // ①かんたんシミュレーションの入力値を、詳細シミュレーション側へそのまま引き継ぐ。
  // 特定口座への毎月積立として年間投資額を組み立て、年齢範囲に合わせてrowsを作り直す。
  const handleGoDetailedFromSimple = useCallback((simple) => {
    const newWithdrawalStartAge = Math.max(simple.currentAge + 1, profile.withdrawalStartAge);
    setProfile((prev) => ({
      ...prev,
      currentAge: simple.currentAge,
      withdrawalStartAge: newWithdrawalStartAge,
      initialTaxable: simple.initialAssets,
      targetAmount: simple.targetAmount,
    }));
    setAssumptions((prev) => ({ ...prev, returnRate: simple.returnRate }));
    const filledRows = regenerateRows(simple.currentAge, newWithdrawalStartAge, CURRENT_YEAR, []).map((r) => ({
      ...r,
      taxable: simple.monthlyContribution * 12,
    }));
    setRows(filledRows);
    setMode("detailed");
    trackEvent("simple_to_detailed");
  }, [profile.withdrawalStartAge]);

  // ---- 結果まとめ(共有・PDF・AIアドバイスで共通して使う) ----
  const finalAsset = sumBucketField(withdrawalStartState, "Balance");
  const totalGain = finalAsset - sumBucketField(withdrawalStartState, "Principal");
  const summary = {
    finalAsset,
    fireAge: withdrawalStartAge,
    achievementAge: achievement ? achievement.age : null,
    totalContribution,
    totalGain,
    fourPercentAnnual: finalAsset * 0.04,
    firstYearWithdrawal: withdrawResult.rows[0] ? withdrawResult.rows[0].withdrawal : 0,
    depletionAge: withdrawResult.depletionAge,
    horizonAge: profile.horizonAge,
  };

  const accumulationYears = Math.max(1, profile.withdrawalStartAge - profile.currentAge);
  const averageMonthlyContribution = totalContribution / accumulationYears / 12;
  const adviceContext = useMemo(() => ({
    currentAge: profile.currentAge, withdrawalStartAge: profile.withdrawalStartAge, horizonAge: profile.horizonAge,
    targetAmount: profile.targetAmount, targetBasis: profile.targetBasis,
    achievementAge: achievement ? achievement.age : null,
    currentTotalAssets, finalAsset,
    returnRate: assumptions.returnRate, withdrawalReturnRate: assumptions.withdrawalReturnRate, inflationRate: assumptions.inflationRate,
    nisaLifetimeUsed, nisaLifetimeLimit: assumptions.lifetimeLimit,
    withdrawalMethod: withdrawalSettings.method, withdrawalRate: withdrawalSettings.rate,
    depletionAge: withdrawResult.depletionAge,
    totalContribution, totalGain, averageMonthlyContribution,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    profile.currentAge, profile.withdrawalStartAge, profile.horizonAge, profile.targetAmount, profile.targetBasis,
    achievement, currentTotalAssets, finalAsset, assumptions.returnRate, assumptions.withdrawalReturnRate, assumptions.inflationRate,
    nisaLifetimeUsed, assumptions.lifetimeLimit, withdrawalSettings.method, withdrawalSettings.rate,
    withdrawResult.depletionAge, totalContribution, totalGain, averageMonthlyContribution,
  ]);

  const showResultsExtras = tab === "growth" || tab === "withdraw";

  if (mode === "simple") {
    return (
      <div className="ip-app">
        <div className="ip-header">
          <div>
            <div className="ip-title">FireMap</div>
            <div className="ip-sub">まずはかんたん5項目で、将来資産とFIRE目標までの見込みをチェックしてみましょう。</div>
          </div>
        </div>
        <SimpleSimulator onGoDetailed={handleGoDetailedFromSimple} />
      </div>
    );
  }

  return (
    <div className="ip-app">
      <div className="ip-header">
        <div>
          <div className="ip-title">FireMap</div>
          <div className="ip-sub">年ごとに異なる投資額・NISA/iDeCo/企業型年金の配分を計画し、将来の資産推移と取り崩しをシミュレーション</div>
        </div>
        <button className="ip-btn ip-btn-ghost" onClick={() => setMode("simple")}>← かんたんモードに戻る</button>
      </div>

      <ScenarioManager getCurrentData={getCurrentData} onLoad={handleLoadSimulation} />

      <GoalCard
        profile={profile} setProfile={setProfile} currentTotalAssets={currentTotalAssets} achievement={achievement}
        totalContribution={totalContribution} totalGain={totalGain}
      />

      <AdviceCard context={adviceContext} />

      <SettingsPanel
        profile={profile} setProfile={setProfile}
        assumptions={assumptions} setAssumptions={setAssumptions}
        contributionPlans={contributionPlans}
        onAddPlan={addContributionPlan} onUpdatePlan={updateContributionPlan}
        onRemovePlan={removeContributionPlan} onApplyPlans={applyContributionPlans}
      />

      <div className="ip-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={"ip-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "plan" && (
        <PlanTab
          rows={rows} updateRow={updateRow} assumptions={assumptions}
          accResults={accResults} totalContribution={totalContribution}
          nisaLifetimeUsed={nisaLifetimeUsed} nisaGrowthUsed={nisaGrowthUsed}
          currentAge={profile.currentAge} currentYear={CURRENT_YEAR} initialBalances={initialBalances}
          targetAmount={profile.targetAmount} targetBasis={profile.targetBasis} inflationRate={assumptions.inflationRate}
          currentTotalAssets={currentTotalAssets} onClearContributions={clearContributions}
        />
      )}
      {tab === "growth" && (
        <GrowthTab chartData={pgChartData} lastAcc={lastAcc} withdrawalStartAge={withdrawalStartAge} achievement={achievement} />
      )}
      {tab === "withdraw" && (
        <WithdrawTab
          settings={withdrawalSettings} setSettings={setWithdrawalSettings}
          profile={profile} setProfile={setProfile}
          withdrawResult={withdrawResult} lastAcc={withdrawalStartState}
          withdrawalStartAge={withdrawalStartAge} amountTriggerNotReached={amountTriggerNotReached}
          chartData={pgChartData}
        />
      )}
      {tab === "compare" && <CompareTab />}
      {tab === "calculator" && <CalculatorTab />}

      <AdBanner page={tab} />

      {showResultsExtras && (
        <>
          <ReportSection chartData={pgChartData} profile={profile} assumptions={assumptions} summary={summary} />
          <NextStepsCard />
        </>
      )}
    </div>
  );
}
