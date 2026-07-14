# FireMap

積立・取り崩しFIREシミュレーター(React + Vite製)

## ローカルで動かす

```bash
npm install
npm run dev
```

`http://localhost:5173` で確認できます。

## ビルド / デプロイ

```bash
npm run build
npm run preview
```

Vercelへは `vercel` コマンド、またはGitHub連携でImportするだけでデプロイできます(`vercel.json`設定済み)。

## 機能一覧

- 積立プラン(年ごとの投資額入力・NISA/iDeCo/企業型年金の枠管理・NISA残り枠表示・現在資産の内訳円グラフ)
- 資産推移(積立期→取り崩し期の元本・運用益グラフ)
- 取り崩しプラン(定率/定額/目標年齢、年齢指定/資産額指定での開始、FIRE時点の資産内訳円グラフ)
- プラン比較(保存済みプランを2〜5件選んで資産推移・主要指標を比較)
- 投資電卓(複利計算・毎月積立計算・FIRE必要資産・4%ルール・積立額逆算・インフレ調整・利回り逆算)
- プランのアドバイス(ルールベースのAIアドバイス)
- ログイン(Google/メールアドレス。現在はSupabase未接続のスタブ実装)
- プランの保存・名前を付けて保存・読み込み・削除(ログイン後、ユーザーごとにlocalStorageへ保存)
- SNS共有(X / LINE / Facebook / URLコピー / 画像として保存)
- PDFレポート出力(A4、プロフィール・前提条件・グラフ・FIRE情報を1枚に)
- 次のステップ(証券会社・クレジットカード等の紹介カード。`src/config/affiliateLinks.js`で一元管理)
- 広告枠(ページごとに表示/非表示を切り替え可能。`src/config/adPlacements.js`で一元管理)
- SEO対応(title/description/OGP/canonical/favicon/robots.txt/sitemap.xml/JSON-LD)

## ディレクトリ構成

```
firemap/
├── index.html                  SEOタグ(OGP/JSON-LD等)を含むエントリーHTML
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── package.json / vite.config.js / vercel.json
└── src/
    ├── main.jsx                 Reactマウント + AuthProviderでラップ
    ├── App.jsx                  アプリ全体の状態管理とレイアウト
    ├── index.css                グローバルCSS(デザイントークン含む)
    ├── constants.js              定数(積立先一覧・デフォルト値・タブ定義)
    ├── config/
    │   ├── affiliateLinks.js     アフィリエイトリンクの一元管理(唯一の情報源)
    │   ├── adPlacements.js        広告表示/非表示のページ別設定(AdSense導入用)
    │   └── shareTargets.js        SNS共有先の一覧(X/LINE/Facebook。追加しやすい配列構造)
    ├── auth/
    │   ├── authClient.js          認証処理(現在はスタブ。Supabase移行時はここだけ差し替え)
    │   └── AuthContext.jsx        ログイン状態を共有するReact Context
    ├── ai/
    │   ├── adviceEngine.js        ルールベースのアドバイス判定ロジック(無料・APIキー不要)
    │   └── aiClient.js            アドバイス呼び出し口(将来OpenAI等に差し替え可能)
    ├── utils/
    │   ├── format.js              金額・パーセントの表示フォーマット
    │   ├── bucketUtils.js         5つの積立先にまたがる合計値などの共通処理
    │   ├── simulate.js            積立・取り崩しシミュレーション本体+プラン比較用の集計関数
    │   ├── calculators.js         投資電卓で使う純粋な計算関数
    │   ├── shareUtils.js          共有テキスト生成・URLコピー・画像保存(html2canvas)
    │   └── pdfExport.js           PDFレポート生成(jsPDF + html2canvas)
    ├── storage/
    │   └── storageAdapter.js      保存/読込/削除の実処理(ユーザーIDで名前空間分け。localStorage実装)
    └── components/
        ├── inputs/                MoneyInput・AgeSelect・PercentSelect・RateInput・IntegerSelect
        ├── ads/AdBanner.jsx        ページ単位で表示切替できる広告バナー(AdSense未設定なら何も描画しない)
        ├── auth/LoginScreen.jsx    ログイン画面(Google/メールアドレス)
        ├── AffiliateCard.jsx       アフィリエイト紹介カード(汎用・プレースホルダーURL検知つき)
        ├── NextStepsCard.jsx       「次のステップ」セクション(AffiliateCardを一覧表示)
        ├── ShareResultCard.jsx     SNS共有・画像保存カード
        ├── ReportSection.jsx       共有+PDF出力をまとめたセクション
        ├── AdviceCard.jsx          ルールベースAIアドバイスの表示
        ├── ScenarioManager.jsx     保存・名前を付けて保存・読み込み・削除のUI(ログイン必須)
        ├── GoalCard.jsx            目標金額・達成度表示
        ├── SettingsPanel.jsx       前提条件カード
        ├── ContributionPlanEditor.jsx  毎月の積立設定の登録一覧
        ├── NisaUsageCard.jsx       NISA枠の使用済み/残り/使用率カード
        ├── AllocationPieChart.jsx  資産内訳の円グラフ
        ├── PlanTab.jsx / PlanRow.jsx  積立プランタブ(行はReact.memoで最適化)
        ├── GrowthTab.jsx / WithdrawTab.jsx  資産推移・取り崩しプランタブ
        ├── CompareTab.jsx          プラン比較タブ
        └── CalculatorTab.jsx       投資電卓タブ
```

## 重要:公開前に必ず設定してください

1. **アフィリエイトリンク** — `src/config/affiliateLinks.js` の `url` を、A8.net等で実際に発行されたリンクに差し替えてください。プレースホルダーのままだと「準備中」表示になり、クリックできません(誤って「Example Domain」に飛ぶ事故を防ぐためのガードです)。
2. **ドメイン** — `index.html` / `public/robots.txt` / `public/sitemap.xml` にある `https://example.com/` を、実際に公開するドメインに置き換えてください。
3. **ログイン** — 現在は `src/auth/authClient.js` がlocalStorageを使ったスタブ実装です。本番でSupabaseを使う場合は、このファイルの中身を `@supabase/supabase-js` の呼び出しに差し替えてください(関数のシグネチャはSupabase Authに合わせてあります)。
4. **広告** — Google AdSenseを使う場合は `src/config/adPlacements.js` の `ADSENSE_CLIENT_ID` を設定し、該当ページの `enabled` を `true` にしてください。

## 依存ライブラリ

- react / react-dom / recharts / lucide-react
- jspdf / html2canvas(PDF出力・画像保存・チャートのキャプチャに使用)
