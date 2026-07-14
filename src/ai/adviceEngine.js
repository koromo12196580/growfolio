import { manYen } from "../utils/format.js";

// ルールベースのアドバイスエンジン(無料・APIキー不要)。
// 「入力内容(context)を受け取り、当てはまるルールのメッセージを配列で返す」という
// 単純な純粋関数の集まりにしてあるので、テストや将来の拡張(OpenAI API併用など)がしやすい。
//
// context には、App側で計算済みの数値をまとめて渡す想定:
// {
//   currentAge, withdrawalStartAge, horizonAge, targetAmount, targetBasis,
//   achievementAge, currentTotalAssets, finalAsset,
//   returnRate, withdrawalReturnRate, inflationRate,
//   nisaLifetimeUsed, nisaLifetimeLimit,
//   withdrawalMethod, withdrawalRate,
//   depletionAge, totalContribution, totalGain,
//   averageMonthlyContribution,
// }

// 目標残高までの到達年数を概算するための簡易シミュレーション(月次複利・単一残高)。
// メインの積立プラン計算(utils/simulate.js)とは別に、アドバイス用の概算にのみ使用する。
function yearsToReachTarget(currentAssets, monthlyContribution, annualRate, target, maxYears = 60) {
  const i = annualRate / 12;
  let balance = currentAssets;
  for (let m = 1; m <= maxYears * 12; m++) {
    balance = balance * (1 + i) + monthlyContribution;
    if (balance >= target) return m / 12;
  }
  return null;
}

function ruleReturnRateTooHigh(ctx) {
  if (ctx.returnRate > 0.08) {
    return `想定利回り年${(ctx.returnRate * 100).toFixed(1)}%はやや強気な設定です。長期の実質リターンは変動しやすいため、5%前後など保守的なシナリオでも確認しておくと安心です。`;
  }
  return null;
}

function ruleNisaRemaining(ctx) {
  const remaining = Math.max(0, (ctx.nisaLifetimeLimit || 0) - (ctx.nisaLifetimeUsed || 0));
  if (remaining > 0) {
    return `NISAの非課税枠がまだ${manYen(remaining)}残っています。積立プランの投資額を見直すと、非課税の恩恵をより活用できます。`;
  }
  return null;
}

function ruleCloseToTarget(ctx) {
  if (ctx.achievementAge != null) return null; // すでに達成見込みなら対象外
  if (!ctx.targetAmount || ctx.targetAmount <= 0) return null;
  const pct = (ctx.finalAsset / ctx.targetAmount) * 100;
  if (pct >= 80 && pct < 100) {
    const remaining = Math.max(0, ctx.targetAmount - ctx.finalAsset);
    return `目標達成率は約${pct.toFixed(0)}%です。あと${manYen(remaining)}で目標達成の見込みです。`;
  }
  return null;
}

function ruleWithdrawalRateHigh(ctx) {
  if (ctx.withdrawalMethod === "rate" && ctx.withdrawalRate > 0.05) {
    return `取り崩し率が年${(ctx.withdrawalRate * 100).toFixed(1)}%とやや高めです。4%前後に抑えると資産寿命が延びやすくなります。`;
  }
  return null;
}

function ruleDepletion(ctx) {
  if (ctx.depletionAge != null && ctx.depletionAge < ctx.horizonAge) {
    return `現在の取り崩しペースだと${ctx.depletionAge}歳で資産が尽きる計算です。取り崩し額(または取り崩し率)を減らすと、資産寿命を延ばせます。`;
  }
  return null;
}

function ruleIncreaseContribution(ctx) {
  if (ctx.achievementAge != null) return null;
  if (!ctx.targetAmount || ctx.targetAmount <= 0) return null;
  const yearsAvailable = ctx.withdrawalStartAge - ctx.currentAge;
  if (yearsAvailable <= 0) return null;
  const extra = 20000;
  const before = yearsToReachTarget(ctx.currentTotalAssets, ctx.averageMonthlyContribution, ctx.returnRate, ctx.targetAmount);
  const after = yearsToReachTarget(ctx.currentTotalAssets, ctx.averageMonthlyContribution + extra, ctx.returnRate, ctx.targetAmount);
  if (before != null && after != null && after < before - 0.1) {
    const diff = before - after;
    return `毎月の積立額を${manYen(extra)}増やすと、目標達成が約${diff.toFixed(1)}年早まる計算です(概算)。`;
  }
  if (before == null && after != null) {
    return `毎月の積立額を${manYen(extra)}増やすと、現在は届いていない目標に約${after.toFixed(1)}年で到達できる計算です(概算)。`;
  }
  return null;
}

function ruleLongerHorizonHelps(ctx) {
  if (ctx.achievementAge == null && ctx.withdrawalStartAge - ctx.currentAge < 40) {
    return `積立期間(運用年数)を延ばすと、複利の効果でさらに資産が増えやすくなります。取り崩し開始年齢を後ろにずらせないか検討してみてください。`;
  }
  return null;
}

const RULES = [
  ruleCloseToTarget,
  ruleIncreaseContribution,
  ruleNisaRemaining,
  ruleWithdrawalRateHigh,
  ruleDepletion,
  ruleReturnRateTooHigh,
  ruleLongerHorizonHelps,
];

// contextを受け取り、当てはまるアドバイス文をすべて配列で返す。
export function generateAdvice(context) {
  return RULES.map((rule) => rule(context)).filter(Boolean);
}
