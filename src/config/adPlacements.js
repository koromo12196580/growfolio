// ページ(タブ)ごとに広告バナーを表示するかどうかの設定。
// ここをtrue/falseに切り替えるだけで、各ページの広告表示・非表示を一括管理できる。
// Google AdSense等を導入する際は、slotIdをAdSenseの広告ユニットIDに対応させて使う想定。
export const AD_PLACEMENTS = {
  plan: { enabled: false, slotId: "plan-bottom" },
  growth: { enabled: false, slotId: "growth-bottom" },
  withdraw: { enabled: false, slotId: "withdraw-bottom" },
  compare: { enabled: false, slotId: "compare-bottom" },
  calculator: { enabled: false, slotId: "calculator-bottom" },
};

export const ADSENSE_CLIENT_ID = ""; // 例: "ca-pub-xxxxxxxxxxxxxxx"(導入時に設定)
