// アプリ全体で使う定数(積立先の一覧、年齢範囲、各種デフォルト値)
export const BUCKETS = [
  { key: "taxable", label: "特定口座", color: "var(--taxable)", badgeClass: "ip-badge-taxable" },
  { key: "tsumitate", label: "つみたて投資枠", color: "var(--tsumitate)", badgeClass: "ip-badge-tsumitate", annualLimitKey: "tsumitateAnnualLimit" },
  { key: "growth", label: "成長投資枠", color: "var(--growth)", badgeClass: "ip-badge-growth", annualLimitKey: "growthAnnualLimit" },
  { key: "ideco", label: "iDeCo", color: "var(--ideco)", badgeClass: "ip-badge-ideco", annualLimitKey: "idecoAnnualLimit" },
  { key: "kigyoNenkin", label: "企業型年金", color: "var(--kigyo)", badgeClass: "ip-badge-kigyo", annualLimitKey: "kigyoAnnualLimit" },
];

export const MIN_AGE = 0;
export const MAX_AGE = 100;

export const CURRENT_YEAR = new Date().getFullYear();

export const DEFAULT_ASSUMPTIONS = {
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

export const DEFAULT_PROFILE = {
  currentAge: 30, withdrawalStartAge: 60, horizonAge: 95,
  initialTaxable: 0, initialTsumitate: 0, initialGrowth: 0, initialIdeco: 0, initialKigyoNenkin: 0,
  targetAmount: 300000000, targetBasis: "real",
};

export const DEFAULT_WITHDRAWAL_SETTINGS = {
  method: "rate", rate: 0.04, fixedAmount: 2400000, targetAge: 95,
  triggerType: "age", triggerAmount: 300000000,
};

export const TABS = [
  { id: "plan", label: "積立プラン" },
  { id: "growth", label: "資産推移" },
  { id: "withdraw", label: "取り崩しプラン" },
  { id: "compare", label: "プラン比較" },
  { id: "calculator", label: "投資電卓" },
];
