import { BUCKETS } from "../constants.js";
import { sumBucketField } from "./bucketUtils.js";

// ---- 目標達成度・積立シミュレーション(既存ロジックのまま。計算式は一切変更していません) ----

export function computeAchievementPct(total, age, currentAge, targetAmount, targetBasis, inflationRate) {
  if (!targetAmount || targetAmount <= 0) return null;
  const compareValue = targetBasis === "real" ? total / Math.pow(1 + inflationRate, age - currentAge) : total;
  return (compareValue / targetAmount) * 100;
}

export function simulateAccumulation(rows, a, initial) {
  const monthlyRate = Math.pow(1 + a.returnRate, 1 / 12) - 1;
  const bal = {}, principal = {};
  BUCKETS.forEach((b) => { bal[b.key] = (initial && initial[b.key]) || 0; principal[b.key] = (initial && initial[b.key]) || 0; });
  // 初期資産としてすでに保有しているNISA残高(つみたて・成長)も生涯枠の使用済み扱いにする
  let nisaLifetimeUsed = ((initial && initial.tsumitate) || 0) + ((initial && initial.growth) || 0);
  let nisaGrowthUsed = (initial && initial.growth) || 0;
  const out = [];
  for (const row of rows) {
    BUCKETS.forEach((b) => {
      const contrib = row[b.key] || 0;
      const monthly = contrib / 12;
      for (let k = 0; k < 12; k++) bal[b.key] = bal[b.key] * (1 + monthlyRate) + monthly;
      principal[b.key] += contrib;
    });
    // この行の投資額を加算する「前」の使用済み額(=この行の入力上限を決めるのに使う)
    const priorNisaLifetimeUsed = nisaLifetimeUsed;
    const priorNisaGrowthUsed = nisaGrowthUsed;
    nisaLifetimeUsed += (row.tsumitate || 0) + (row.growth || 0);
    nisaGrowthUsed += row.growth || 0;
    const total = BUCKETS.reduce((s, b) => s + bal[b.key], 0);
    const totalPrincipal = BUCKETS.reduce((s, b) => s + principal[b.key], 0);
    const rowOut = {
      age: row.age, year: row.year, total, totalPrincipal, totalGain: total - totalPrincipal,
      nisaLifetimeUsed, nisaGrowthUsed, priorNisaLifetimeUsed, priorNisaGrowthUsed,
    };
    BUCKETS.forEach((b) => {
      rowOut[b.key + "Balance"] = bal[b.key];
      rowOut[b.key + "Principal"] = principal[b.key];
      if (b.annualLimitKey) rowOut[b.key + "OverAnnual"] = (row[b.key] || 0) > a[b.annualLimitKey];
    });
    rowOut.nisaLifetimeOver = Math.round(nisaLifetimeUsed) > Math.round(a.lifetimeLimit);
    rowOut.nisaGrowthLifetimeOver = Math.round(nisaGrowthUsed) > Math.round(a.lifetimeGrowthLimit);
    out.push(rowOut);
  }
  return out;
}

export function computeRowMax(bucketKey, assumptions, priorNisaLifetimeUsed, priorNisaGrowthUsed) {
  if (bucketKey === "tsumitate") {
    const remainLifetime = Math.max(0, assumptions.lifetimeLimit - priorNisaLifetimeUsed);
    return Math.min(assumptions.tsumitateAnnualLimit, remainLifetime);
  }
  if (bucketKey === "growth") {
    const remainLifetime = Math.max(0, assumptions.lifetimeLimit - priorNisaLifetimeUsed);
    const remainGrowthLifetime = Math.max(0, assumptions.lifetimeGrowthLimit - priorNisaGrowthUsed);
    return Math.min(assumptions.growthAnnualLimit, remainLifetime, remainGrowthLifetime);
  }
  if (bucketKey === "ideco") return assumptions.idecoAnnualLimit;
  if (bucketKey === "kigyoNenkin") return assumptions.kigyoAnnualLimit;
  return undefined; // 特定口座:上限なし
}

// rows配列を、年間上限・NISA生涯枠(初期資産含む)に収まるよう年齢順にクランプする。
// 値が変わらない行は同じオブジェクト参照を返すため、呼び出し側で不要な再レンダリングを避けられる。
export function clampRowsToLimits(rows, assumptions, initialTsumitate, initialGrowth) {
  let priorNisa = (initialTsumitate || 0) + (initialGrowth || 0);
  let priorGrowth = initialGrowth || 0;
  let anyChanged = false;
  const next = rows.map((r) => {
    let rowChanged = false;
    const nr = { ...r };
    if ((nr.ideco || 0) > assumptions.idecoAnnualLimit) { nr.ideco = assumptions.idecoAnnualLimit; rowChanged = true; }
    if ((nr.kigyoNenkin || 0) > assumptions.kigyoAnnualLimit) { nr.kigyoNenkin = assumptions.kigyoAnnualLimit; rowChanged = true; }
    const maxTsumitate = Math.max(0, computeRowMax("tsumitate", assumptions, priorNisa, priorGrowth));
    if ((nr.tsumitate || 0) > maxTsumitate) { nr.tsumitate = maxTsumitate; rowChanged = true; }
    const maxGrowth = Math.max(0, computeRowMax("growth", assumptions, priorNisa, priorGrowth));
    if ((nr.growth || 0) > maxGrowth) { nr.growth = maxGrowth; rowChanged = true; }
    priorNisa += (nr.tsumitate || 0) + (nr.growth || 0);
    priorGrowth += nr.growth || 0;
    if (rowChanged) anyChanged = true;
    return rowChanged ? nr : r;
  });
  return { rows: next, changed: anyChanged };
}

export function simulateWithdrawal(startState, settings, a) {
  const monthlyRate = Math.pow(1 + a.withdrawalReturnRate, 1 / 12) - 1;
  const bal = {}, principal = {};
  BUCKETS.forEach((b) => {
    bal[b.key] = startState[b.key + "Balance"] || 0;
    principal[b.key] = startState[b.key + "Principal"] || 0;
  });
  const out = [];
  let depletionAge = null;
  const years = Math.max(settings.horizonAge - settings.startAge + 1, 0);
  for (let i = 0; i < years; i++) {
    const age = settings.startAge + i;
    const total = BUCKETS.reduce((s, b) => s + bal[b.key], 0);
    if (total <= 1) {
      const zeroRow = { age, total: 0, withdrawal: 0, totalPrincipal: 0, totalGain: 0 };
      BUCKETS.forEach((b) => { zeroRow[b.key + "Balance"] = 0; });
      out.push(zeroRow);
      if (depletionAge === null) depletionAge = age;
      continue;
    }
    let withdraw;
    if (settings.method === "fixed") withdraw = settings.fixedAmount;
    else if (settings.method === "rate") withdraw = total * settings.rate;
    else {
      const yearsLeft = Math.max(settings.targetAge - age + 1, 1);
      withdraw = total / yearsLeft;
    }
    withdraw = Math.max(0, Math.min(withdraw, total));
    const ratio = withdraw / total;
    BUCKETS.forEach((b) => {
      principal[b.key] *= 1 - ratio;
      bal[b.key] -= bal[b.key] * ratio;
    });
    const remaining = BUCKETS.reduce((s, b) => s + bal[b.key], 0);
    const remainingPrincipal = BUCKETS.reduce((s, b) => s + principal[b.key], 0);
    const remainingGain = remaining - remainingPrincipal;
    if (depletionAge === null && remaining <= 1) depletionAge = age;
    const rowOut = { age, total: remaining, withdrawal: withdraw, totalPrincipal: remainingPrincipal, totalGain: remainingGain };
    BUCKETS.forEach((b) => { rowOut[b.key + "Balance"] = bal[b.key]; });
    out.push(rowOut);
    // 翌年分の残高としてこの1年の運用益を反映(=指定年齢ちょうどから取り崩しを開始するため、成長は取り崩し後に適用)
    BUCKETS.forEach((b) => { for (let k = 0; k < 12; k++) bal[b.key] *= 1 + monthlyRate; });
  }
  return { rows: out, depletionAge };
}

export function findAchievementPoint(accResults, targetAmount, useReal, inflationRate, currentAge) {
  if (!targetAmount || targetAmount <= 0) return null;
  const basis = useReal ? "real" : "nominal";
  for (const r of accResults) {
    const pct = computeAchievementPct(r.total, r.age, currentAge, targetAmount, basis, inflationRate);
    if (pct != null && pct >= 100) return { ...r, compareValue: (pct / 100) * targetAmount };
  }
  return null;
}

function fallbackAccRow(initialBalances, currentTotalAssets) {
  const fb = { total: currentTotalAssets, totalPrincipal: currentTotalAssets, totalGain: 0 };
  BUCKETS.forEach((b) => { fb[b.key + "Balance"] = initialBalances[b.key]; fb[b.key + "Principal"] = initialBalances[b.key]; });
  return fb;
}

// 保存された1プラン分のデータ(profile/assumptions/rows/withdrawalSettings)から、
// プラン比較タブで使う要約指標とグラフ用の時系列を計算する。
// simulateAccumulation / simulateWithdrawal など既存の計算関数をそのまま再利用している。
export function computeScenarioSummary(data) {
  const { profile, assumptions, rows, withdrawalSettings } = data;
  const initialBalances = {
    taxable: profile.initialTaxable, tsumitate: profile.initialTsumitate, growth: profile.initialGrowth,
    ideco: profile.initialIdeco, kigyoNenkin: profile.initialKigyoNenkin,
  };
  const currentTotalAssets = sumBucketField(initialBalances, "");
  const accResults = simulateAccumulation(rows, assumptions, initialBalances);
  const lastAcc = accResults.length ? accResults[accResults.length - 1] : fallbackAccRow(initialBalances, currentTotalAssets);

  const achievement = findAchievementPoint(
    accResults, profile.targetAmount, profile.targetBasis === "real", assumptions.inflationRate, profile.currentAge
  );
  const amountTrigger = withdrawalSettings.triggerType === "amount"
    ? findAchievementPoint(accResults, withdrawalSettings.triggerAmount, false, assumptions.inflationRate, profile.currentAge)
    : null;
  const withdrawalStartState = withdrawalSettings.triggerType === "amount" && amountTrigger ? amountTrigger : lastAcc;
  const withdrawalStartAge = withdrawalSettings.triggerType === "amount"
    ? (amountTrigger ? amountTrigger.age : profile.withdrawalStartAge)
    : profile.withdrawalStartAge;

  const withdrawResult = simulateWithdrawal(
    withdrawalStartState, { startAge: withdrawalStartAge, horizonAge: profile.horizonAge, ...withdrawalSettings }, assumptions
  );

  const totalContribution = rows.reduce((s, r) => s + sumBucketField(r, ""), 0);
  const finalAsset = sumBucketField(lastAcc, "Balance");
  const totalGain = finalAsset - sumBucketField(lastAcc, "Principal");
  const fourPercentAnnual = finalAsset * 0.04;
  const firstYearWithdrawal = withdrawResult.rows[0] ? withdrawResult.rows[0].withdrawal : 0;

  const series = [
    ...accResults.map((r) => ({ age: r.age, value: r.total })),
    ...withdrawResult.rows.map((r) => ({ age: r.age, value: r.total })),
  ];

  return {
    finalAsset,
    fireAge: withdrawalStartAge,
    achievementAge: achievement ? achievement.age : null,
    totalContribution,
    totalGain,
    fourPercentAnnual,
    firstYearWithdrawal,
    depletionAge: withdrawResult.depletionAge,
    horizonAge: profile.horizonAge,
    series,
  };
}

// 複数プランの時系列(age, value)を年齢をキーにマージし、折れ線グラフ用のデータに変換する
export function mergeSeriesByAge(namedSeriesList) {
  const ageSet = new Set();
  namedSeriesList.forEach((ns) => ns.series.forEach((p) => ageSet.add(p.age)));
  const ages = Array.from(ageSet).sort((a, b) => a - b);
  return ages.map((age) => {
    const point = { age };
    namedSeriesList.forEach((ns) => {
      const found = ns.series.find((p) => p.age === age);
      point[ns.name] = found ? found.value : null;
    });
    return point;
  });
}
