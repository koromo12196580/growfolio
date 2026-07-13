# FireMap

積立・取り崩しプランナー(React + Vite製)

## ローカルで動かす

```bash
npm install
npm run dev
```

`http://localhost:5173` で確認できます。

## ビルド

```bash
npm run build
npm run preview
```

`dist/` フォルダに静的ファイルが出力されます。

## Vercelへのデプロイ

### 方法1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### 方法2: GitHub連携

1. このフォルダの中身をGitHubリポジトリにpush
2. [vercel.com](https://vercel.com) でそのリポジトリをImport
3. Framework Presetは自動で「Vite」が検出されます(`vercel.json`にも設定済み)
4. Deploy

## 機能

- 積立プラン(年ごとの投資額入力・NISA/iDeCo/企業型年金の枠管理・NISA残り枠表示・現在資産の内訳円グラフ)
- 資産推移(積立期→取り崩し期の元本・運用益グラフ)
- 取り崩しプラン(定率/定額/目標年齢、年齢指定/資産額指定での開始、FIRE時点の資産内訳円グラフ)
- プラン比較(保存済みプランを2〜5件選んで資産推移・主要指標を比較)
- 投資電卓(複利計算・毎月積立計算・FIRE必要資産・4%ルール・積立額逆算・インフレ調整・利回り逆算)
- プランの保存・名前を付けて保存・読み込み・削除(現在はlocalStorage、将来Supabase等に移行しやすい構成)
- 次のステップ(証券会社紹介。`src/data/affiliateLinks.js`に追加するだけでカードが増える)

## ディレクトリ構成

```
firemap/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── src/
    ├── main.jsx                 Reactのマウント処理
    ├── App.jsx                  アプリ全体の状態管理とレイアウト
    ├── index.css                グローバルCSS(デザイントークン含む)
    ├── constants.js              定数(積立先一覧・デフォルト値・タブ定義)
    ├── data/
    │   └── affiliateLinks.js     おすすめ証券会社リンクの配列(ここに追加するだけでカードが増える)
    ├── utils/
    │   ├── format.js              金額・パーセントの表示フォーマット
    │   ├── bucketUtils.js         5つの積立先にまたがる合計値などの共通処理
    │   ├── simulate.js            積立・取り崩しシミュレーション本体(既存ロジック)+プラン比較用の集計関数
    │   └── calculators.js         投資電卓で使う純粋な計算関数
    ├── storage/
    │   └── storageAdapter.js      保存/読込/削除の実処理(localStorage実装。将来Supabase化する際はここだけ差し替え)
    └── components/
        ├── inputs/                MoneyInput・AgeSelect・PercentSelect・RateInput・IntegerSelect
        ├── ScenarioManager.jsx     保存・名前を付けて保存・読み込み・削除のUI
        ├── GoalCard.jsx            目標金額・達成度表示
        ├── SettingsPanel.jsx       前提条件カード(現在資産・積立設定・年齢利回り・NISA上限)
        ├── ContributionPlanEditor.jsx  毎月の積立設定の登録一覧
        ├── NisaUsageCard.jsx       NISA枠の使用済み/残り/使用率カード
        ├── AllocationPieChart.jsx  資産内訳の円グラフ
        ├── PlanTab.jsx / GrowthTab.jsx / WithdrawTab.jsx  積立プラン・資産推移・取り崩しプランの各タブ
        ├── CompareTab.jsx          プラン比較タブ
        ├── CalculatorTab.jsx       投資電卓タブ
        ├── NextStepsCard.jsx       証券会社紹介カード
        └── AdSlot.jsx              Google AdSense等を後から追加するためのプレースホルダー
```

## 依存ライブラリ

- react / react-dom
- recharts(グラフ描画)
- lucide-react(アイコン)

## 保存機能について

`src/storage/storageAdapter.js` に `listSimulations` / `saveSimulation` / `loadSimulation` / `deleteSimulation` / `renameSimulation` を実装しています。
現在はブラウザの localStorage を使っていますが、すべて `async` 関数として作ってあるため、将来 Supabase 等のバックエンドに差し替える場合もこのファイルの中身を書き換えるだけで、呼び出し側(`ScenarioManager.jsx` や `CompareTab.jsx`)の変更は基本的に不要です。

## アフィリエイト/広告について

`src/data/affiliateLinks.js` の配列にオブジェクトを追加するだけで、`NextStepsCard` に自動でカードが増えます。
Google AdSense を導入する場合は `src/components/AdSlot.jsx` の `adsenseEnabled` を `true` にして広告コードを追加してください。
