import React, { useEffect } from "react";
import { affiliateLinks, validateAffiliateLinks } from "../config/affiliateLinks.js";
import AffiliateCard from "./AffiliateCard.jsx";

// シミュレーション結果を見た後の「次のステップ」案内。
// 広告然としないよう、他のカードと同じデザインでさりげなく証券会社等を紹介する。
// 表示するリンクはすべて src/config/affiliateLinks.js の1配列で管理しているため、
// 広告リンクの追加・変更・削除はそのファイルを触るだけで全ページに反映される。
export default function NextStepsCard() {
  useEffect(() => {
    validateAffiliateLinks(); // プレースホルダーURLが残っていないか開発時にコンソール警告する
  }, []);

  if (!affiliateLinks || affiliateLinks.length === 0) return null;

  return (
    <div className="ip-card">
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>次のステップ</div>
      <div className="ip-note" style={{ marginBottom: 14 }}>
        シミュレーション結果が決まったら、実際に投資を始めてみましょう。
      </div>
      <div className="ip-affiliate-grid">
        {affiliateLinks.map((item) => (
          <AffiliateCard key={item.id || item.name} item={item} />
        ))}
      </div>
      <div className="ip-note" style={{ marginTop: 12 }}>
        ※本アプリのリンクには広告(アフィリエイト)を含む場合があります。
      </div>
    </div>
  );
}
