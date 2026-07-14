// SNS共有ボタンの定義。ここに1件追加するだけで共有ボタンが増える(Instagram等を後で追加しやすい)。
// 各ターゲットは buildUrl(text, url) で共有用URLを組み立てる関数を持つ。
// Web Share APIやURLスキームに対応していないターゲット(Instagram等)は buildUrl を null にし、
// ShareResultCard側で「画像を保存してInstagramに投稿してください」のような案内を出す想定。
export const shareTargets = [
  {
    id: "x",
    label: "X (Twitter)",
    buildUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "line",
    label: "LINE",
    buildUrl: (text, url) => `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    buildUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  // 今後の追加例:
  // {
  //   id: "instagram",
  //   label: "Instagram",
  //   buildUrl: null, // Instagramはweb共有URLが無いため、画像保存を案内する
  // },
];
