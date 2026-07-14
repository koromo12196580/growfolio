import { yen, manYen } from "./format.js";

// PDFレポートを生成する。jsPDF/html2canvasはこの関数が呼ばれた時にだけ動的importする
// (通常のシミュレーション画面ではこれらのライブラリを読み込まず、軽量に保つため)。
export async function exportSimulationToPdf({
  profile, assumptions, finalAsset, fireAge, achievementAge, annualWithdrawal, fourPercentAnnual,
  totalContribution, totalGain, depletionAge, chartElement, filename = "firemap-simulation.pdf",
}) {
  const { default: jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text) => {
    ensureSpace(10);
    doc.setFontSize(13);
    doc.setTextColor(27, 42, 74); // navy
    doc.text(text, margin, y);
    y += 7;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10.5);
  };

  const line = (text) => {
    ensureSpace(6);
    doc.text(text, margin, y);
    y += 5.5;
  };

  doc.setFontSize(18);
  doc.setTextColor(27, 42, 74);
  doc.text("FireMap シミュレーションレポート", margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`作成日: ${new Date().toLocaleDateString("ja-JP")}`, margin, y);
  y += 10;
  doc.setTextColor(30, 30, 30);

  heading("プロフィール");
  line(`現在の年齢: ${profile.currentAge}歳`);
  line(`取り崩し開始年齢: ${profile.withdrawalStartAge}歳`);
  line(`資産寿命の想定年齢: ${profile.horizonAge}歳`);
  line(`目標金額: ${yen(profile.targetAmount)}(${profile.targetBasis === "real" ? "現在価値" : "名目"})`);
  y += 3;

  heading("前提条件");
  line(`積立期の想定利回り: ${(assumptions.returnRate * 100).toFixed(1)}%`);
  line(`取り崩し期の想定利回り: ${(assumptions.withdrawalReturnRate * 100).toFixed(1)}%`);
  line(`インフレ率: ${(assumptions.inflationRate * 100).toFixed(1)}%`);
  y += 3;

  heading("FIRE情報 / 取り崩し計画");
  line(`最終資産(取り崩し開始時点): ${yen(finalAsset)}`);
  line(`FIRE年齢: ${fireAge}歳`);
  line(`目標達成年齢: ${achievementAge != null ? `${achievementAge}歳` : "未達成"}`);
  line(`累計投資額: ${yen(totalContribution)}`);
  line(`運用益: ${yen(totalGain)}`);
  line(`年間取り崩し額: ${yen(annualWithdrawal)}`);
  line(`4%ルールの年間取り崩し額目安: ${yen(fourPercentAnnual)}`);
  line(`資産寿命: ${depletionAge != null ? `${depletionAge}歳で枯渇` : `${profile.horizonAge}歳時点で残あり`}`);
  y += 3;

  if (chartElement) {
    const canvas = await html2canvas(chartElement, { backgroundColor: "#ffffff", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    heading("資産推移グラフ");
    ensureSpace(imgHeight + 4);
    doc.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
    y += imgHeight + 6;
  }

  doc.save(filename);
}
