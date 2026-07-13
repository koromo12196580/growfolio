import React, { useState, useMemo, useEffect } from "react";
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  PiggyBank, TrendingUp, Wallet, Settings2, AlertTriangle,
} from "lucide-react";

// ---------- constants & helpers ----------

const BUCKETS = [
  { key: "taxable", label: "特定口座", color: "var(--taxable)", badgeClass: "ip-badge-taxable" },
  { key: "tsumitate", label: "つみたて投資枠", color: "var(--tsumitate)", badgeClass: "ip-badge-tsumitate", annualLimitKey: "tsumitateAnnualLimit" },
  { key: "growth", label: "成長投資枠", color: "var(--growth)", badgeClass: "ip-badge-growth", annualLimitKey: "growthAnnualLimit" },
  { key: "ideco", label: "iDeCo", color: "var(--ideco)", badgeClass: "ip-badge-ideco", annualLimitKey: "idecoAnnualLimit" },
  { key: "kigyoNenkin", label: "企業型年金", color: "var(--kigyo)", badgeClass: "ip-badge-kigyo", annualLimitKey: "kigyoAnnualLimit" },
];

const DEFAULT_ASSUMPTIONS = {
  returnRate: 0.05,
  withdrawalReturnRate: 0.03,
  inflationRate: 0.02,
  tsumitateAnnualLimit: 1200000,
  growthAnnualLimit: 2400000,
  lifetimeLimit: 18000000,
  lifetimeGrowthLimit: 12000000,
  idecoAnnualLimit: 276000,
  kigyoAnnualLimit: 330000,
};

const CURRENT_YEAR = new Date().getFullYear();

const yen = (n) => {
  const v = Math.round(n || 0);
  return (v < 0 ? "-" : "") + "¥" + Math.abs(v).toLocaleString("ja-JP");
};
const manYen = (n) => {
  const v = Math.round((n || 0) / 10000);
  return v.toLocaleString("ja-JP") + "万円";
};

function emptyBucketRow() {
  const o = {};
  BUCKETS.forEach((b) => { o[b.key] = 0; });
  return o;
}

function makeDefaultRow(age, year) {
  return { age, year, ...emptyBucketRow() };
}

function regenerateRows(currentAge, withdrawalStartAge, baseYear, existingRows) {
  const map = new Map((existingRows || []).map((r) => [r.age, r]));
  const rows = [];
  for (let age = currentAge; age < withdrawalStartAge; age++) {
    const year = baseYear + (age - currentAge);
    rows.push(map.get(age) || makeDefaultRow(age, year));
  }
  return rows;
}

function sumBucketField(obj, suffix) {
  return BUCKETS.reduce((s, b) => s + (obj[b.key + suffix] || 0), 0);
}

function computeAchievementPct(total, age, currentAge, targetAmount, targetBasis, inflationRate) {
  if (!targetAmount || targetAmount <= 0) return null;
  const compareValue = targetBasis === "real" ? total / Math.pow(1 + inflationRate, age - currentAge) : total;
  return (compareValue / targetAmount) * 100;
}

function simulateAccumulation(rows, a, initial) {
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

function computeRowMax(bucketKey, assumptions, priorNisaLifetimeUsed, priorNisaGrowthUsed) {
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

// rows配列を、年間上限・NISA生涯枠(初期資産含む)に収まるよう年齢順にクランプする
function clampRowsToLimits(rows, assumptions, initialTsumitate, initialGrowth) {
  let priorNisa = (initialTsumitate || 0) + (initialGrowth || 0);
  let priorGrowth = initialGrowth || 0;
  return rows.map((r) => {
    const nr = { ...r };
    if ((nr.ideco || 0) > assumptions.idecoAnnualLimit) nr.ideco = assumptions.idecoAnnualLimit;
    if ((nr.kigyoNenkin || 0) > assumptions.kigyoAnnualLimit) nr.kigyoNenkin = assumptions.kigyoAnnualLimit;
    const maxTsumitate = Math.max(0, computeRowMax("tsumitate", assumptions, priorNisa, priorGrowth));
    if ((nr.tsumitate || 0) > maxTsumitate) nr.tsumitate = maxTsumitate;
    const maxGrowth = Math.max(0, computeRowMax("growth", assumptions, priorNisa, priorGrowth));
    if ((nr.growth || 0) > maxGrowth) nr.growth = maxGrowth;
    priorNisa += (nr.tsumitate || 0) + (nr.growth || 0);
    priorGrowth += nr.growth || 0;
    return nr;
  });
}

function simulateWithdrawal(startState, settings, a) {
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

const MIN_AGE = 0;
const MAX_AGE = 100;

function findAchievementPoint(accResults, targetAmount, useReal, inflationRate, currentAge) {
  if (!targetAmount || targetAmount <= 0) return null;
  const basis = useReal ? "real" : "nominal";
  for (const r of accResults) {
    const pct = computeAchievementPct(r.total, r.age, currentAge, targetAmount, basis, inflationRate);
    if (pct != null && pct >= 100) return { ...r, compareValue: (pct / 100) * targetAmount };
  }
  return null;
}

// ---------- reusable input ----------

function MoneyInput({ value, onChange, max, className, style, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const display = editing ? text : value ? value.toLocaleString("ja-JP") : "0";
  return (
    <input
      type="text"
      inputMode="numeric"
      className={className || "ip-input"}
      style={style}
      placeholder={placeholder}
      value={display}
      onFocus={(e) => { setEditing(true); setText(value ? String(value) : ""); e.target.select(); }}
      onBlur={() => setEditing(false)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        let num = raw === "" ? 0 : parseInt(raw, 10);
        if (max != null && num > max) num = max;
        setText(num === 0 ? "" : String(num));
        onChange(num);
      }}
    />
  );
}

function AgeSelect({ value, onChange, className, style }) {
  const options = useMemo(() => Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i), []);
  return (
    <select
      className={className || "ip-select"}
      style={style}
      value={Math.min(MAX_AGE, Math.max(MIN_AGE, value ?? 0))}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {options.map((age) => (
        <option key={age} value={age}>{age}歳</option>
      ))}
    </select>
  );
}

function PercentSelect({ value, onChange, maxPercent = 20, step = 0.5, className, style }) {
  const stepsCount = Math.round(maxPercent / step);
  const options = useMemo(() => Array.from({ length: stepsCount + 1 }, (_, i) => i), [stepsCount]);
  const currentIndex = Math.min(stepsCount, Math.max(0, Math.round(((value || 0) * 100) / step)));
  return (
    <select
      className={className || "ip-select"}
      style={style}
      value={currentIndex}
      onChange={(e) => {
        const idx = Number(e.target.value);
        onChange((idx * step) / 100);
      }}
    >
      {options.map((i) => {
        const pct = i * step;
        return <option key={i} value={i}>{pct}%</option>;
      })}
    </select>
  );
}

function RateInput({ value, onChange, className, style, min = 0, max = 1 }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const display = editing ? text : value || value === 0 ? String(value) : "0";
  return (
    <input
      type="text"
      inputMode="decimal"
      className={className || "ip-input"}
      style={style}
      value={display}
      onFocus={(e) => { setEditing(true); setText(value ? String(value) : ""); e.target.select(); }}
      onBlur={() => setEditing(false)}
      onChange={(e) => {
        let raw = e.target.value.replace(/[^0-9.]/g, "");
        const parts = raw.split(".");
        if (parts.length > 2) raw = parts[0] + "." + parts.slice(1).join("");
        setText(raw);
        let num = raw === "" || raw === "." ? 0 : parseFloat(raw);
        if (isNaN(num)) num = 0;
        if (min != null && num < min) num = min;
        if (max != null && num > max) num = max;
        onChange(num);
      }}
    />
  );
}

// ---------- UI ----------

const TABS = [
  { id: "plan", label: "積立プラン", icon: PiggyBank },
  { id: "growth", label: "資産推移", icon: TrendingUp },
  { id: "withdraw", label: "取り崩しプラン", icon: Wallet },
];

export default function App() {
  const [profile, setProfile] = useState({
    currentAge: 30, withdrawalStartAge: 60, horizonAge: 95,
    initialTaxable: 0, initialTsumitate: 0, initialGrowth: 0, initialIdeco: 0, initialKigyoNenkin: 0,
    targetAmount: 300000000, targetBasis: "real",
  });
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [rows, setRows] = useState(() => regenerateRows(30, 60, CURRENT_YEAR, []));
  const [withdrawalSettings, setWithdrawalSettings] = useState({
    method: "rate", rate: 0.04, fixedAmount: 2400000, targetAge: 95,
    triggerType: "age", triggerAmount: 300000000,
  });
  const [tab, setTab] = useState("plan");
  const [contributionPlans, setContributionPlans] = useState([]);

  const addContributionPlan = () => {
    setContributionPlans((prev) => [
      ...prev,
      {
        id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `plan-${Date.now()}-${Math.random()}`,
        bucket: "tsumitate", monthlyAmount: 0, startAge: profile.currentAge, endAge: profile.withdrawalStartAge,
      },
    ]);
  };
  const updateContributionPlan = (id, field, value) => {
    setContributionPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const removeContributionPlan = (id) => {
    setContributionPlans((prev) => prev.filter((p) => p.id !== id));
  };
  // 「積立設定を反映」:設定でカバーされている(年齢, 積立先)だけをrowsへ書き込む。
  // カバーされていない年齢・積立先の手入力値はそのまま保持されるため、手入力と競合しない。
  const applyContributionPlans = () => {
    setRows((prev) =>
      prev.map((r) => {
        const nr = { ...r };
        BUCKETS.forEach((b) => {
          const covering = contributionPlans.filter(
            (p) => p.bucket === b.key && r.age >= p.startAge && r.age < p.endAge
          );
          if (covering.length > 0) {
            nr[b.key] = covering.reduce((s, p) => s + (p.monthlyAmount || 0) * 12, 0);
          }
        });
        return nr;
      })
    );
  };

  useEffect(() => {
    setRows((prev) => regenerateRows(profile.currentAge, profile.withdrawalStartAge, CURRENT_YEAR, prev));
  }, [profile.currentAge, profile.withdrawalStartAge]);

  // NISA生涯枠(初期資産分を含む)やiDeCo/企業型年金の年間上限が変わった場合、既存の入力値を新しい残り枠に合わせて即座にクランプする
  useEffect(() => {
    setRows((prev) => {
      let changed = false;
      let priorNisa = (profile.initialTsumitate || 0) + (profile.initialGrowth || 0);
      let priorGrowth = profile.initialGrowth || 0;
      const next = prev.map((r) => {
        const nr = { ...r };
        let rowChanged = false;
        if ((nr.ideco || 0) > assumptions.idecoAnnualLimit) { nr.ideco = assumptions.idecoAnnualLimit; rowChanged = true; }
        if ((nr.kigyoNenkin || 0) > assumptions.kigyoAnnualLimit) { nr.kigyoNenkin = assumptions.kigyoAnnualLimit; rowChanged = true; }
        const maxTsumitate = Math.max(0, computeRowMax("tsumitate", assumptions, priorNisa, priorGrowth));
        if ((nr.tsumitate || 0) > maxTsumitate) { nr.tsumitate = maxTsumitate; rowChanged = true; }
        const maxGrowth = Math.max(0, computeRowMax("growth", assumptions, priorNisa, priorGrowth));
        if ((nr.growth || 0) > maxGrowth) { nr.growth = maxGrowth; rowChanged = true; }
        priorNisa += (nr.tsumitate || 0) + (nr.growth || 0);
        priorGrowth += nr.growth || 0;
        if (rowChanged) changed = true;
        return rowChanged ? nr : r;
      });
      return changed ? next : prev;
    });
  }, [
    assumptions.tsumitateAnnualLimit, assumptions.growthAnnualLimit, assumptions.idecoAnnualLimit, assumptions.kigyoAnnualLimit,
    assumptions.lifetimeLimit, assumptions.lifetimeGrowthLimit, profile.initialTsumitate, profile.initialGrowth,
  ]);

  const clearContributions = () => {
    setRows((prev) => prev.map((r) => ({ ...r, ...emptyBucketRow() })));
  };

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

  const totalContribution = rows.reduce((s, r) => s + BUCKETS.reduce((s2, b) => s2 + (r[b.key] || 0), 0), 0);
  const nisaLifetimeUsed = accResults.length
    ? accResults[accResults.length - 1].nisaLifetimeUsed
    : initialBalances.tsumitate + initialBalances.growth;
  const nisaGrowthUsed = accResults.length ? accResults[accResults.length - 1].nisaGrowthUsed : initialBalances.growth;

  const updateRow = (age, field, value) => {
    setRows((prev) => prev.map((r) => (r.age === age ? { ...r, [field]: value } : r)));
  };

  const pgChartData = useMemo(() => {
    const point = (r, phase) => ({
      age: r.age, phase,
      元本: Math.round(r.totalPrincipal),
      運用益: Math.round(Math.max(0, r.totalGain)),
      合計: Math.round(r.total),
    });
    return [...accResults.map((r) => point(r, "積立期")), ...withdrawResult.rows.map((r) => point(r, "取り崩し期"))];
  }, [accResults, withdrawResult]);

  return (
    <div className="ip-app">
      <style>{`
        .ip-app {
          --navy:#1B2A4A; --ink:#26344F; --muted:#5B6B6A; --paper:#F3F5F2; --card:#FFFFFF;
          --border:#DCDFD8; --taxable:#B8863B; --tsumitate:#2F6F62; --growth:#3D6B99; --ideco:#6E4A73; --kigyo:#7A8B4A; --warn:#A8503F;
          --serif: 'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP',serif;
          --sans: 'Hiragino Kaku Gothic ProN','Yu Gothic','Noto Sans JP',sans-serif;
          --mono: 'SF Mono','Consolas','Menlo',monospace;
          background: var(--paper); color: var(--ink); font-family: var(--sans);
          min-height: 100%; padding: 20px; box-sizing: border-box;
        }
        .ip-app * { box-sizing: border-box; }
        .ip-header { display:flex; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:18px; }
        .ip-title { font-family: var(--serif); font-size: 26px; font-weight:700; color:var(--navy); letter-spacing:.02em; }
        .ip-sub { color: var(--muted); font-size:13px; margin-top:2px; }
        .ip-tabs { display:flex; gap:6px; margin-bottom:16px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
        .ip-tab { display:flex; align-items:center; gap:6px; padding:10px 14px; font-size:13.5px; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; background:none; border-top:none; border-left:none; border-right:none; }
        .ip-tab.active { color: var(--navy); border-bottom-color: var(--navy); font-weight:600; }
        .ip-card { background: var(--card); border:1px solid var(--border); border-radius:10px; padding:18px; margin-bottom:16px; }
        .ip-grid { display:grid; gap:14px; }
        .ip-grid-3 { grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); }
        .ip-stat-label { font-size:12px; color:var(--muted); margin-bottom:4px; }
        .ip-stat-value { font-family: var(--mono); font-size:20px; font-weight:600; color:var(--navy); }
        .ip-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; }
        .ip-badge-taxable { background:rgba(184,134,59,0.14); color:var(--taxable); }
        .ip-badge-tsumitate { background:rgba(47,111,98,0.14); color:var(--tsumitate); }
        .ip-badge-growth { background:rgba(61,107,153,0.14); color:var(--growth); }
        .ip-badge-ideco { background:rgba(110,74,115,0.14); color:var(--ideco); }
        .ip-badge-kigyo { background:rgba(122,139,74,0.14); color:var(--kigyo); }
        .ip-table-wrap { overflow-x:auto; }
        table.ip-table { width:100%; border-collapse: collapse; font-size:13px; }
        table.ip-table th { text-align:right; font-weight:600; color:var(--muted); font-size:11.5px; padding:6px 8px; border-bottom:1px solid var(--border); white-space:nowrap;}
        table.ip-table th:first-child, table.ip-table td:first-child { text-align:left; }
        table.ip-table td { padding:4px 8px; border-bottom:1px solid #EEF0EB; text-align:right; white-space:nowrap; }
        table.ip-table input { width:96px; text-align:right; font-family:var(--mono); border:1px solid var(--border); border-radius:5px; padding:4px 6px; font-size:12.5px; }
        .ip-row-warn { background: rgba(168,80,63,0.06); }
        .ip-row-achieved { background: rgba(47,111,98,0.08); }
        .ip-initial-row td { background:#F7F8F4; font-style:italic; color:var(--muted); }
        .ip-btn { display:inline-flex; align-items:center; gap:6px; background:var(--navy); color:#fff; border:none; padding:9px 16px; border-radius:7px; font-size:13.5px; cursor:pointer; }
        .ip-btn:disabled { opacity:0.5; cursor:default; }
        .ip-btn-ghost { background:none; color:var(--navy); border:1px solid var(--border); }
        .ip-input-label { font-size:12px; color:var(--muted); display:block; margin-bottom:4px; }
        .ip-input { font-family:var(--mono); border:1px solid var(--border); border-radius:6px; padding:7px 9px; font-size:13px; width:100%; }
        .ip-select { border:1px solid var(--border); border-radius:6px; padding:7px 9px; font-size:13px; width:100%; background:#fff; }
        .ip-note { font-size:12px; color:var(--muted); line-height:1.6; }
        .ip-warning-box { display:flex; gap:8px; background:rgba(168,80,63,0.08); border:1px solid rgba(168,80,63,0.25); color:var(--warn); border-radius:8px; padding:10px 12px; font-size:12.5px; margin-top:10px; }
        .ip-chat-msg { padding:10px 12px; border-radius:8px; margin-bottom:8px; font-size:13.5px; line-height:1.7; white-space:pre-wrap; }
        .ip-chat-user { background:#EFF2ED; }
        .ip-chat-ai { background:rgba(47,111,98,0.08); border:1px solid rgba(47,111,98,0.18); }
        .ip-app input[type=number]::-webkit-outer-spin-button,
        .ip-app input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        .ip-app input[type=number] { -moz-appearance:textfield; }
        .ip-plan-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:10px 0; border-bottom:1px solid #EEF0EB; }
        .ip-plan-row:last-of-type { border-bottom:none; }
        .ip-plan-row select.ip-select { width:auto; min-width:150px; }
        .ip-plan-row .ip-input, .ip-plan-row select.ip-select.ip-age-select { width:auto; min-width:80px; }
      `}</style>

      <div className="ip-header">
        <div>
          <div className="ip-title">FireMap</div>
          <div className="ip-sub">年ごとに異なる投資額・NISA/iDeCo/企業型年金の配分を計画し、将来の資産推移と取り崩しをシミュレーション</div>
        </div>
      </div>

      <GoalCard profile={profile} setProfile={setProfile} currentTotalAssets={currentTotalAssets} achievement={achievement} />

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

        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--navy)" }}>毎月の積立設定</div>
        <div className="ip-note" style={{ marginBottom: 10 }}>
          積立先・毎月の金額・積立期間(年齢)を登録し、「積立設定を反映」を押すと下の「積立プラン」表の年間投資額へ自動入力されます。反映は、設定でカバーされている年齢・積立先のセルだけを上書きします。カバーされていない年齢・積立先の手入力値はそのまま残ります。同じ積立先・年齢が複数の設定と重なる場合は合算されます。
        </div>
        {contributionPlans.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {contributionPlans.map((p) => (
              <div key={p.id} className="ip-plan-row">
                <select
                  className="ip-select" style={{ width: "auto", minWidth: 160 }}
                  value={p.bucket}
                  onChange={(e) => updateContributionPlan(p.id, "bucket", e.target.value)}
                >
                  {BUCKETS.map((b) => (
                    <option key={b.key} value={b.key}>{b.label}</option>
                  ))}
                </select>
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>月額</span>
                <MoneyInput
                  style={{ width: 130 }}
                  value={p.monthlyAmount}
                  onChange={(v) => updateContributionPlan(p.id, "monthlyAmount", v)}
                />
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>円/月</span>
                <AgeSelect
                  style={{ width: "auto", minWidth: 90 }}
                  value={p.startAge}
                  onChange={(v) => updateContributionPlan(p.id, "startAge", v)}
                />
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>〜</span>
                <AgeSelect
                  style={{ width: "auto", minWidth: 90 }}
                  value={p.endAge}
                  onChange={(v) => updateContributionPlan(p.id, "endAge", v)}
                />
                <button className="ip-btn ip-btn-ghost" style={{ fontSize: 12, padding: "6px 12px", marginLeft: "auto" }}
                  onClick={() => removeContributionPlan(p.id)}>
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button className="ip-btn ip-btn-ghost" onClick={addContributionPlan}>＋積立設定を追加</button>
          <button className="ip-btn" disabled={contributionPlans.length === 0} onClick={applyContributionPlans}>
            積立設定を反映
          </button>
        </div>

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

      <div className="ip-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={"ip-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
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
    </div>
  );
}

function GoalCard({ profile, setProfile, currentTotalAssets, achievement }) {
  const pct = profile.targetAmount > 0 ? (currentTotalAssets / profile.targetAmount) * 100 : 0;
  const barPct = Math.max(0, Math.min(100, pct));
  const blocks = 10;
  const filled = Math.round((barPct / 100) * blocks);
  const remainingAmount = Math.max(0, profile.targetAmount - currentTotalAssets);
  const remainingYears = achievement ? Math.max(0, achievement.age - profile.currentAge) : null;
  return (
    <div className="ip-card">
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <label className="ip-input-label">目標金額(FIRE目標など)</label>
            <MoneyInput value={profile.targetAmount} onChange={(v) => setProfile((p) => ({ ...p, targetAmount: v }))} style={{ width: 180 }} />
          </div>
          <div>
            <label className="ip-input-label">目標金額の基準</label>
            <select className="ip-select" value={profile.targetBasis}
              onChange={(e) => setProfile((p) => ({ ...p, targetBasis: e.target.value }))} style={{ width: 200 }}>
              <option value="real">現在価値(実質・インフレ調整後)</option>
              <option value="nominal">名目(将来時点の金額そのまま)</option>
            </select>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="ip-stat-label">達成度</div>
          <div className="ip-stat-value" style={{ color: "var(--tsumitate)" }}>{pct.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
        {Array.from({ length: blocks }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 14, borderRadius: 3, background: i < filled ? "var(--tsumitate)" : "#E7E9E2" }} />
        ))}
      </div>
      <div className="ip-note">
        現在資産 {manYen(currentTotalAssets)} / 目標 {manYen(profile.targetAmount)}(あと{manYen(remainingAmount)})
        {achievement
          ? `　→　現在のプランでは ${achievement.age}歳(${achievement.year}年、あと${remainingYears}年) で目標到達見込みです。`
          : `　→　現在の入力期間内では目標に到達しません。積立プランのタブで投資額を増やすか期間を延ばしてください。`}
      </div>
    </div>
  );
}

function PlanTab({
  rows, updateRow, assumptions, accResults, totalContribution, nisaLifetimeUsed, nisaGrowthUsed,
  currentAge, currentYear, initialBalances, targetAmount, targetBasis, inflationRate, currentTotalAssets, onClearContributions,
}) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const lifetimePct = Math.min(100, (nisaLifetimeUsed / assumptions.lifetimeLimit) * 100);
  const growthPct = Math.min(100, (nisaGrowthUsed / assumptions.lifetimeGrowthLimit) * 100);
  const hasInitial = sumBucketField(initialBalances, "") > 0;
  const principalTotal = currentTotalAssets + totalContribution;

  return (
    <div>
      <div className="ip-grid ip-grid-3">
        <div className="ip-card">
          <div className="ip-stat-label">現在資産(初期入力)</div>
          <div className="ip-stat-value">{yen(currentTotalAssets)}</div>
        </div>
        <div className="ip-card">
          <div className="ip-stat-label">元本合計(現在資産+累計投資額)</div>
          <div className="ip-stat-value">{yen(principalTotal)}</div>
        </div>
        <div className="ip-card">
          <div className="ip-stat-label">NISA生涯枠 使用状況</div>
          <div className="ip-stat-value">{manYen(nisaLifetimeUsed)} / {manYen(assumptions.lifetimeLimit)}</div>
          <div style={{ background: "#EEF0EB", height: 6, borderRadius: 4, marginTop: 6 }}>
            <div style={{ width: lifetimePct + "%", background: "var(--tsumitate)", height: 6, borderRadius: 4 }} />
          </div>
        </div>
        <div className="ip-card">
          <div className="ip-stat-label">うち成長投資枠 使用状況</div>
          <div className="ip-stat-value">{manYen(nisaGrowthUsed)} / {manYen(assumptions.lifetimeGrowthLimit)}</div>
          <div style={{ background: "#EEF0EB", height: 6, borderRadius: 4, marginTop: 6 }}>
            <div style={{ width: growthPct + "%", background: "var(--growth)", height: 6, borderRadius: 4 }} />
          </div>
        </div>
      </div>

      <div className="ip-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {BUCKETS.map((b) => (
              <span key={b.key} className={"ip-badge " + b.badgeClass}>{b.label}</span>
            ))}
          </div>
          {!confirmingClear ? (
            <button className="ip-btn ip-btn-ghost" onClick={() => setConfirmingClear(true)}>
              積立金額をクリア
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, color: "var(--warn)" }}>積立金額をすべて0にしますか?</span>
              <button
                className="ip-btn"
                style={{ background: "var(--warn)" }}
                onClick={() => { onClearContributions(); setConfirmingClear(false); }}
              >
                はい、クリアする
              </button>
              <button className="ip-btn ip-btn-ghost" onClick={() => setConfirmingClear(false)}>
                キャンセル
              </button>
            </div>
          )}
        </div>
        <div className="ip-note" style={{ marginBottom: 10 }}>
          年ごとに金額を自由に変更できます。ボーナスでの増額や単発の臨時投資も、その年の金額に加えて入力してください。NISA/iDeCo/企業型年金は年間上限を超える金額は入力できません。「年末資産残高」と「目標達成度」は、想定利回りで運用した結果です。
        </div>
        <div className="ip-table-wrap">
          <table className="ip-table">
            <thead>
              <tr>
                <th>年 / 年齢</th>
                {BUCKETS.map((b) => <th key={b.key}>{b.label}</th>)}
                <th>年間投資額</th>
                <th>運用益</th>
                <th>年末資産残高</th>
                <th>目標達成度</th>
              </tr>
            </thead>
            <tbody>
              {hasInitial && (
                <tr className="ip-initial-row">
                  <td>{currentYear}年 / {currentAge}歳(期首残高)</td>
                  {BUCKETS.map((b) => <td key={b.key}>{yen(initialBalances[b.key])}</td>)}
                  <td>{yen(sumBucketField(initialBalances, ""))}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              )}
              {rows.map((r, i) => {
                const acc = accResults[i];
                const warn = acc && (BUCKETS.some((b) => acc[b.key + "OverAnnual"]) || acc.nisaLifetimeOver || acc.nisaGrowthLifetimeOver);
                const rowTotal = sumBucketField(r, "");
                const pct = acc ? computeAchievementPct(acc.total, acc.age, currentAge, targetAmount, targetBasis, inflationRate) : null;
                const achieved = pct != null && pct >= 100;
                return (
                  <tr key={r.age} className={warn ? "ip-row-warn" : achieved ? "ip-row-achieved" : ""}>
                    <td>{r.year}年 / {r.age}歳</td>
                    {BUCKETS.map((b) => (
                      <td key={b.key}>
                        <MoneyInput
                          value={r[b.key]}
                          onChange={(v) => updateRow(r.age, b.key, v)}
                          max={acc ? computeRowMax(b.key, assumptions, acc.priorNisaLifetimeUsed, acc.priorNisaGrowthUsed) : undefined}
                        />
                      </td>
                    ))}
                    <td style={{ fontFamily: "var(--mono)" }}>{yen(rowTotal)}</td>
                    <td style={{ fontFamily: "var(--mono)", color: "var(--tsumitate)" }}>{acc ? yen(acc.totalGain) : "-"}</td>
                    <td style={{ fontFamily: "var(--mono)", color: "var(--growth)" }}>{acc ? yen(acc.total) : "-"}</td>
                    <td style={{ fontFamily: "var(--mono)", color: achieved ? "var(--tsumitate)" : "var(--muted)", fontWeight: achieved ? 700 : 400 }}>
                      {pct != null ? pct.toFixed(1) + "%" : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(Math.round(nisaLifetimeUsed) > Math.round(assumptions.lifetimeLimit) || Math.round(nisaGrowthUsed) > Math.round(assumptions.lifetimeGrowthLimit)) && (
          <div className="ip-warning-box">
            <AlertTriangle size={16} />
            <span>NISAの非課税保有限度額(生涯枠)を超える入力があります。該当年の行が薄い赤色で表示されています。</span>
          </div>
        )}
      </div>
    </div>
  );
}

function GrowthTab({ chartData, lastAcc, withdrawalStartAge, achievement }) {
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

function WithdrawTab({ settings, setSettings, profile, setProfile, withdrawResult, lastAcc, withdrawalStartAge, amountTriggerNotReached, chartData }) {
  const totalBalance = sumBucketField(lastAcc, "Balance");
  const withdrawChartData = chartData.filter((d) => d.phase === "取り崩し期");
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

