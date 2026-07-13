import React from "react";
import { affiliateLinks } from "../data/affiliateLinks.js";

// シミュレーション結果を見た後の「次のステップ」案内。⑥の対応。
// 広告然としないよう、他のカードと同じデザインでさりげなく証券会社を紹介する。
// affiliateLinks配列に追加するだけで自動でカードが増える。
// 将来Google AdSense等を追加する場合は、このコンポーネントの下(または横)に
// 同じ ip-card スタイルの <AdSlot /> のようなコンポーネントを並べて追加すればよい構成にしてある。
export default function NextStepsCard() {
  if (!affiliateLinks || affiliateLinks.length === 0) return null;

  return (
    <div className="ip-card">
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>次のステップ</div>
      <div className="ip-note" style={{ marginBottom: 14 }}>
        シミュレーション結果が決まったら、実際に投資を始めてみましょう。
      </div>
      <div className="ip-affiliate-grid">
        {affiliateLinks.map((item) => (
          <div key={item.name} className="ip-affiliate-card">
            <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 14 }}>{item.name}</div>
            <div className="ip-note" style={{ margin: "6px 0 12px" }}>{item.description}</div>
            <a
              href={item.url}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="ip-btn"
              style={{ textDecoration: "none", display: "inline-flex" }}
            >
              {item.ctaLabel || "口座開設はこちら"}
            </a>
          </div>
        ))}
      </div>
      <div className="ip-note" style={{ marginTop: 12 }}>
        ※本アプリのリンクには広告(アフィリエイト)を含む場合があります。
      </div>
    </div>
  );
}
