import React from "react";

// 将来Google AdSense等を差し込むためのプレースホルダー。
// 今はまだ広告コードを入れていないため何も表示しないが、
// 実際に導入する際はここに <ins className="adsbygoogle" ... /> などを追加し、
// 表示したい場所にこのコンポーネントを配置するだけで済む構成にしてある。
export default function AdSlot({ slotId, label }) {
  const adsenseEnabled = false; // AdSense導入時にtrueにする

  if (!adsenseEnabled) return null;

  return (
    <div className="ip-card" data-ad-slot={slotId}>
      <div className="ip-note" style={{ textAlign: "center" }}>{label || "広告"}</div>
      {/* <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client="ca-pub-xxxxxxxxxxxxxxx" data-ad-slot={slotId} /> */}
    </div>
  );
}
