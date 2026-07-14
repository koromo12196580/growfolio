import React, { useRef, useState } from "react";
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ShareResultCard from "./ShareResultCard.jsx";
import { exportSimulationToPdf } from "../utils/pdfExport.js";
import { manYen, yen } from "../utils/format.js";

// シミュレーション結果を見た後の「共有」「PDF保存」をまとめたセクション。
// PDF/画像出力用に、常にマウントされた小さな資産推移チャートをここに持たせている
// (タブ切り替えで表示・非表示が変わる資産推移タブとは別に、常に取得できるDOM要素が必要なため)。
export default function ReportSection({ chartData, profile, assumptions, summary }) {
  const chartRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");

  const handleExportPdf = async () => {
    setExporting(true);
    setPdfMessage("");
    try {
      await exportSimulationToPdf({
        profile, assumptions,
        finalAsset: summary.finalAsset,
        fireAge: summary.fireAge,
        achievementAge: summary.achievementAge,
        annualWithdrawal: summary.firstYearWithdrawal,
        fourPercentAnnual: summary.fourPercentAnnual,
        totalContribution: summary.totalContribution,
        totalGain: summary.totalGain,
        depletionAge: summary.depletionAge,
        chartElement: chartRef.current,
      });
    } catch (e) {
      setPdfMessage("PDFの生成に失敗しました(このプレビュー環境では利用できない場合があります。実際にデプロイした環境でお試しください)。");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <ShareResultCard
        finalAsset={summary.finalAsset}
        fireAge={summary.fireAge}
        achievementAge={summary.achievementAge}
        annualWithdrawal={summary.firstYearWithdrawal}
        totalGain={summary.totalGain}
      />

      <div className="ip-card">
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 10 }}>PDFレポート</div>
        <div className="ip-note" style={{ marginBottom: 12 }}>
          プロフィール・前提条件・資産推移グラフ・FIRE情報・取り崩し計画をまとめたA4のPDFを作成します。
        </div>
        <div ref={chartRef} style={{ background: "#fff", padding: 8 }}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData}>
              <CartesianGrid stroke="#E5E7E0" strokeDasharray="3 3" />
              <XAxis dataKey="age" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => manYen(v)} width={70} />
              <Tooltip formatter={(v) => yen(v)} labelFormatter={(l) => l + "歳"} />
              <Area type="monotone" dataKey="元本" stackId="1" stroke="var(--growth)" fill="var(--growth)" fillOpacity={0.3} />
              <Area type="monotone" dataKey="運用益" stackId="1" stroke="var(--tsumitate)" fill="var(--tsumitate)" fillOpacity={0.4} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <button className="ip-btn" style={{ marginTop: 12 }} onClick={handleExportPdf} disabled={exporting}>
          {exporting ? "作成中…" : "PDFを保存"}
        </button>
        {pdfMessage && <div className="ip-note" style={{ marginTop: 8, color: "var(--warn)" }}>{pdfMessage}</div>}
      </div>
    </div>
  );
}
