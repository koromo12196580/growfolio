import React from "react";

// 証券会社・クレジットカード・ポイントサイトなどを紹介する汎用カード。
// 画像・タイトル・説明・ボタン・リンクを1件のデータで表現できる。
// クリックできる要素(カード全体・ボタン)はすべて同じA8.net等のリンクへ飛ぶようにしてある。
//
// item.placeholder が true、またはURLがexample.com等のプレースホルダードメインの場合は、
// 誤って「Example Domain」等の意図しないページに飛ばないよう、リンクなしの「準備中」表示にする。
function isPlaceholderUrl(url) {
  if (!url) return true;
  return /example\.(com|org|net)/i.test(url) || /REPLACE_WITH/i.test(url);
}

export default function AffiliateCard({ item }) {
  const { name, description, image, url, ctaLabel, category, placeholder } = item;
  const notReady = Boolean(placeholder) || isPlaceholderUrl(url);

  const content = (
    <>
      {image && (
        <img src={image} alt={name} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, marginBottom: 10 }} />
      )}
      {category && <div className="ip-note" style={{ marginBottom: 2 }}>{category}</div>}
      <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 14 }}>{name}</div>
      <div className="ip-note" style={{ margin: "6px 0 12px" }}>{description}</div>
      {notReady ? (
        <span className="ip-badge" style={{ background: "rgba(91,107,106,0.14)", color: "var(--muted)" }}>準備中(リンク未設定)</span>
      ) : (
        <span className="ip-btn" style={{ display: "inline-flex" }}>{ctaLabel || "詳細はこちら"}</span>
      )}
    </>
  );

  if (notReady) {
    return (
      <div className="ip-affiliate-card" style={{ opacity: 0.6 }} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      className="ip-affiliate-card"
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {content}
    </a>
  );
}
