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
```

`dist/` フォルダに静的ファイルが出力されます。

```bash
npm run preview
```

でビルド後の内容をローカル確認できます。

## Vercelへのデプロイ

### 方法1: Vercel CLI

```bash
npm i -g vercel
vercel
```

質問に沿って進めるだけでデプロイできます(Framework Preset は自動で "Vite" が検出されます)。

### 方法2: GitHub連携

1. このフォルダの中身をGitHubリポジトリにpush
2. [vercel.com](https://vercel.com) でそのリポジトリをImport
3. Build Command: `npm run build` / Output Directory: `dist` (自動検出されるはずですが、`vercel.json` にも設定済みです)
4. Deployをクリック

## 構成

```
firemap/
├── index.html          エントリーHTML
├── package.json         依存パッケージ・スクリプト
├── vite.config.js       Vite設定
├── vercel.json          Vercelデプロイ設定
├── .gitignore
└── src/
    ├── main.jsx         Reactのマウント処理
    ├── App.jsx          アプリ本体(積立プラン・資産推移・取り崩しプランの3タブ)
    └── index.css        最小限のグローバルCSS
```

## 依存ライブラリ

- react / react-dom
- recharts(グラフ描画)
- lucide-react(アイコン)
