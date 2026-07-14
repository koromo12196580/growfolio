import React from "react";
import { AD_PLACEMENTS, ADSENSE_CLIENT_ID } from "../../config/adPlacements.js";

// ページ単位で表示・非表示を切り替えられる広告バナー。
// - AD_PLACEMENTS[page].enabled が false、またはADSENSE_CLIENT_IDが未設定の間は何も描画しない
//   (＝広告がなくてもレイアウトが崩れない)。
// - 導入時は ADSENSE_CLIENT_ID を設定し、AD_PLACEMENTSの該当ページを enabled: true にするだけでよい。
export default function AdBanner({ page }) {
  const placement = AD_PLACEMENTS[page];
  if (!placement || !placement.enabled || !ADSENSE_CLIENT_ID) return null;

  return (
    <div className="ip-card ip-ad-banner" data-ad-slot={placement.slotId}>
      <div className="ip-note" style={{ textAlign: "center", marginBottom: 6 }}>広告</div>
      {/*
        AdSense導入時はここに以下のようなタグを追加し、
        index.htmlにAdSenseの読み込みスクリプトを追加してください。
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={placement.slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      */}
    </div>
  );
}
