// 金額表示のフォーマット共通処理
export const yen = (n) => {
  const v = Math.round(n || 0);
  return (v < 0 ? "-" : "") + "¥" + Math.abs(v).toLocaleString("ja-JP");
};

export const manYen = (n) => {
  const v = Math.round((n || 0) / 10000);
  return v.toLocaleString("ja-JP") + "万円";
};

export const pct1 = (n) => `${(n || 0).toFixed(1)}%`;
