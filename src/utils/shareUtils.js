import { yen } from "./format.js";

// シェア用のテキストを組み立てる純粋関数。UIとは無関係にテストしやすいよう分離してある。
export function buildShareText({ finalAsset, fireAge, achievementAge, annualWithdrawal, totalGain }) {
  const lines = [
    "【FireMap シミュレーション結果】",
    `最終資産: ${yen(finalAsset)}`,
    fireAge != null ? `FIRE年齢: ${fireAge}歳` : null,
    achievementAge != null ? `目標達成年齢: ${achievementAge}歳` : null,
    annualWithdrawal != null ? `年間取り崩し額: ${yen(annualWithdrawal)}` : null,
    totalGain != null ? `運用益: ${yen(totalGain)}` : null,
    "#FireMap #FIRE #資産形成",
  ].filter(Boolean);
  return lines.join("\n");
}

// 現在のURLをクリップボードにコピーする(Web Share APIが無い環境向けの共通処理)
export async function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  // フォールバック(古いブラウザ向け)
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  return ok;
}

// 指定した要素を画像として保存する(html2canvasを利用)。
// html2canvasは動的importにして、使う画面でのみ読み込まれるようにしている。
export async function saveElementAsImage(element, filename = "firemap-result.png") {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, { backgroundColor: "#ffffff", scale: 2 });
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
