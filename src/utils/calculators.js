// 投資電卓で使う純粋な計算関数群(UIとは無関係。単体テストや将来の再利用がしやすいよう分離)

// ① 複利計算:一括投資が年数後にいくらになるか(月次複利)
export function compoundInterest(principal, annualRate, years) {
  const n = Math.max(0, Math.round(years * 12));
  const i = annualRate / 12;
  const fv = principal * Math.pow(1 + i, n);
  return { futureValue: fv, gain: fv - principal };
}

// ② 毎月積立計算:初期資産+毎月積立が年数後にいくらになるか(月次複利)
export function monthlyContributionFutureValue(initial, monthly, annualRate, years) {
  const n = Math.max(0, Math.round(years * 12));
  const i = annualRate / 12;
  const growthOfInitial = initial * Math.pow(1 + i, n);
  const growthOfContrib = Math.abs(i) < 1e-9 ? monthly * n : monthly * ((Math.pow(1 + i, n) - 1) / i);
  const fv = growthOfInitial + growthOfContrib;
  const principal = initial + monthly * n;
  return { futureValue: fv, principal, gain: fv - principal };
}

// ③ FIRE必要資産:年間支出と取り崩し率から必要資産額を逆算
export function fireRequiredAssets(annualExpense, withdrawalRate) {
  if (!withdrawalRate) return null;
  return annualExpense / withdrawalRate;
}

// ④ 4%ルール:資産額から年間・月間の安全な取り崩し額を計算
export function fourPercentRule(assets, rate = 0.04) {
  const annual = assets * rate;
  return { annual, monthly: annual / 12 };
}

// ⑤ 目標達成に必要な毎月積立額を逆算(初期資産・年数・利回りを踏まえる)
export function requiredMonthlyContribution(target, initial, annualRate, years) {
  const n = Math.max(1, Math.round(years * 12));
  const i = annualRate / 12;
  const growthOfInitial = initial * Math.pow(1 + i, n);
  const remaining = target - growthOfInitial;
  if (remaining <= 0) return 0;
  if (Math.abs(i) < 1e-9) return remaining / n;
  return remaining / ((Math.pow(1 + i, n) - 1) / i);
}

// ⑥ インフレ調整:現在の金額が何年後にいくらの名目額に相当するか/将来の金額の現在価値
export function inflationAdjust(amount, inflationRate, years, direction = "toFuture") {
  const factor = Math.pow(1 + inflationRate, years);
  return direction === "toFuture" ? amount * factor : amount / factor;
}

// ⑦ 利回り逆算:初期資産・毎月積立・年数・目標額から必要な年率利回りを二分探索で求める
export function solveRequiredRate(initial, monthly, years, target, opts = {}) {
  const { lo = -0.5, hi = 1.0, iterations = 100 } = opts;
  const n = Math.max(1, Math.round(years * 12));
  const fv = (rate) => {
    const i = rate / 12;
    if (Math.abs(i) < 1e-9) return initial + monthly * n;
    return initial * Math.pow(1 + i, n) + monthly * ((Math.pow(1 + i, n) - 1) / i);
  };
  if (fv(hi) < target) return null; // この範囲では届かない
  if (fv(lo) >= target) return lo;
  let a = lo, b = hi;
  for (let k = 0; k < iterations; k++) {
    const mid = (a + b) / 2;
    if (fv(mid) < target) a = mid; else b = mid;
  }
  return (a + b) / 2;
}
