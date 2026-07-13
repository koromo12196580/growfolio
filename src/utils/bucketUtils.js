import { BUCKETS } from "../constants.js";

// 5つの積立先(特定口座/つみたて/成長/iDeCo/企業型年金)にまたがる合計値を計算する共通ヘルパー。
// suffix "" なら {taxable, tsumitate, ...} 形式、"Balance"/"Principal" なら各年の計算結果に対して使う。
export function sumBucketField(obj, suffix) {
  return BUCKETS.reduce((s, b) => s + ((obj && obj[b.key + suffix]) || 0), 0);
}

export function emptyBucketRow() {
  const o = {};
  BUCKETS.forEach((b) => { o[b.key] = 0; });
  return o;
}

export function makeDefaultRow(age, year) {
  return { age, year, ...emptyBucketRow() };
}

// 現在年齢〜取り崩し開始年齢の行データを生成する。既存の行があれば年齢をキーに値を引き継ぐ。
export function regenerateRows(currentAge, withdrawalStartAge, baseYear, existingRows) {
  const map = new Map((existingRows || []).map((r) => [r.age, r]));
  const rows = [];
  for (let age = currentAge; age < withdrawalStartAge; age++) {
    const year = baseYear + (age - currentAge);
    rows.push(map.get(age) || makeDefaultRow(age, year));
  }
  return rows;
}
