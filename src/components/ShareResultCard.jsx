import React, { useRef, useState } from "react";
import { shareTargets } from "../config/shareTargets.js";
import { buildShareText, copyTextToClipboard, saveElementAsImage } from "../utils/shareUtils.js";
import { yen } from "../utils/format.js";
import { trackEvent } from "../utils/analytics.js";

// シミュレーション結果をSNSで共有するためのカード。
// 資産推移・FIRE年齢・目標達成年齢・最終資産・年間取り崩し額・運用益をまとめて表示し、
// X/LINE/Facebook/URLコピー/画像保存に対応する。共有先はconfig/shareTargets.jsに追加するだけで増える。
export default function ShareResultCard({ finalAsset, fireAge, achievementAge, annualWithdrawal, totalGain }) {
  const cardRef = useRef(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [imageSaving, setImageSaving] = useState(false);

  const shareText = buildShareText({ finalAsset, fireAge, achievementAge, annualWithdrawal, totalGain });
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(shareUrl);
    trackEvent("share_click", { method: "copy_url" });
    setCopyMessage(ok ? "URLをコピーしました" : "コピーに失敗しました");
    setTimeout(() => setCopyMessage(""), 2500);
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setImageSaving(true);
    try {
      await saveElementAsImage(cardRef.current, "firemap-result.png");
      trackEvent("share_click", { method: "save_image" });
    } catch (e) {
      setCopyMessage("画像の保存に失敗しました(このプレビュー環境では利用できない場合があります)");
      setTimeout(() => setCopyMessage(""), 3000);
    } finally {
      setImageSaving(false);
    }
  };

  return (
    <div className="ip-card">
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 10 }}>シミュレーション結果を共有</div>

      <div ref={cardRef} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--serif)", fontWeight: 700, color: "var(--navy)", fontSize: 16, marginBottom: 10 }}>FireMap シミュレーション結果</div>
        <div className="ip-grid ip-grid-3">
          <div>
            <div className="ip-stat-label">最終資産</div>
            <div className="ip-stat-value">{yen(finalAsset)}</div>
          </div>
          {fireAge != null && (
            <div>
              <div className="ip-stat-label">FIRE年齢</div>
              <div className="ip-stat-value">{fireAge}歳</div>
            </div>
          )}
          {achievementAge != null && (
            <div>
              <div className="ip-stat-label">目標達成年齢</div>
              <div className="ip-stat-value">{achievementAge}歳</div>
            </div>
          )}
          {annualWithdrawal != null && (
            <div>
              <div className="ip-stat-label">年間取り崩し額</div>
              <div className="ip-stat-value">{yen(annualWithdrawal)}</div>
            </div>
          )}
          {totalGain != null && (
            <div>
              <div className="ip-stat-label">運用益</div>
              <div className="ip-stat-value" style={{ color: "var(--tsumitate)" }}>{yen(totalGain)}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {shareTargets.map((t) => (
          t.buildUrl ? (
            <a
              key={t.id}
              href={t.buildUrl(shareText, shareUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="ip-btn ip-btn-ghost"
              style={{ textDecoration: "none" }}
              onClick={() => trackEvent("share_click", { method: t.id })}
            >
              {t.label}
            </a>
          ) : null
        ))}
        <button className="ip-btn ip-btn-ghost" onClick={handleCopy}>URLをコピー</button>
        <button className="ip-btn" onClick={handleSaveImage} disabled={imageSaving}>
          {imageSaving ? "保存中…" : "画像として保存"}
        </button>
      </div>
      {copyMessage && <div className="ip-note" style={{ marginTop: 8, color: "var(--tsumitate)" }}>{copyMessage}</div>}
    </div>
  );
}
