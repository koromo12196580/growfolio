// 「次のステップ」で紹介する証券会社・クレジットカード・ポイントサイトなどのリンク一覧。
// ここに1件追加するだけで、NextStepsCard側に自動でカードが増える(=広告管理はこのファイル1か所)。
//
// 重要: url には必ずA8.netなどで実際に発行された計測リンクをそのまま入れてください。
// https://example.com や https://example.org のようなプレースホルダードメインを本番に残すと、
// クリック時に「Example Domain」ページが表示されてしまいます(今回発生した不具合の原因)。
// 未設定の項目は placeholder: true にしておくと、下のバリデーションで警告が出ます。

export const AFFILIATE_CATEGORIES = {
  SECURITIES: "証券会社",
  CREDIT_CARD: "クレジットカード",
  POINT_SITE: "ポイントサイト",
};

export const affiliateLinks = [
  {
    id: "dmm-kabu",
    category: AFFILIATE_CATEGORIES.SECURITIES,
    name: "DMM株",
    description: "初心者にもおすすめの証券会社。取引手数料が無料で始めやすいのが特徴です。",
    image: null, // 例: "/images/affiliate/dmm-kabu.png"
    // ▼▼ ここをA8.netの発行リンクにそのまま差し替えてください ▼▼
    // 例: "https://px.a8.net/svt/ejp?a8mat=XXXXXX+YYYYYY+ZZZZ+ZZZZZZ"
    url: "https://px.a8.net/svt/ejp?a8mat=REPLACE_WITH_YOUR_A8NET_LINK",
    ctaLabel: "口座開設はこちら",
    placeholder: true, // 実リンクに差し替えたら false にする
  },
  // 今後の追加例(A8.netなどの発行リンクに差し替えて配列へ追加するだけでOK):
  // {
  //   id: "sbi-shoken",
  //   category: AFFILIATE_CATEGORIES.SECURITIES,
  //   name: "SBI証券",
  //   description: "口座開設数No.1クラス。取扱商品の幅広さが魅力です。",
  //   image: null,
  //   url: "https://px.a8.net/svt/ejp?a8mat=XXXXXX+YYYYYY+ZZZZ+ZZZZZZ",
  //   ctaLabel: "口座開設はこちら",
  //   placeholder: true,
  // },
  // {
  //   id: "rakuten-card",
  //   category: AFFILIATE_CATEGORIES.CREDIT_CARD,
  //   name: "楽天カード",
  //   description: "投信積立のポイント還元に強いクレジットカードです。",
  //   image: null,
  //   url: "https://px.a8.net/svt/ejp?a8mat=XXXXXX+YYYYYY+ZZZZ+ZZZZZZ",
  //   ctaLabel: "詳細はこちら",
  //   placeholder: true,
  // },
];

// 開発中にプレースホルダーURLが残っていないかをコンソールに警告する簡易バリデーション。
// 本番ビルドでも動作はするが、URLが未設定のままだと目立つように警告するだけで表示自体は止めない。
export function validateAffiliateLinks(links = affiliateLinks) {
  const problems = [];
  links.forEach((item) => {
    const url = item.url || "";
    const looksLikePlaceholderDomain = /example\.(com|org|net)/i.test(url) || /REPLACE_WITH/i.test(url);
    if (item.placeholder || looksLikePlaceholderDomain) {
      problems.push(`[affiliateLinks] "${item.name}" のリンクがプレースホルダーのままです。実際のA8.net等のリンクに差し替えてください。`);
    }
  });
  if (problems.length && typeof console !== "undefined") {
    problems.forEach((p) => console.warn(p));
  }
  return problems;
}
