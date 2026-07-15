// Google Analytics 4 (gtag.js) 連携。
// - スクリプトの読み込み・初期化はこのファイルだけで完結させ、他のコンポーネントからは
//   trackPageView() / trackEvent() を呼ぶだけで済むようにしてある。
// - 測定IDは "G-3FNLF9R0GJ" の1つのみ。ローカル(localhost)・本番を問わず常に計測する。
//   (開発者自身のアクセスは、GA4管理画面側のIPアドレス除外フィルタで対応する運用のため)
// - タブ切り替えをSPA内の「ページ遷移」とみなし、App.jsx側でタブが変わるたびに
//   trackPageView() を呼んで訪問状況・利用状況を計測する。

const MEASUREMENT_ID = "G-3FNLF9R0GJ";
let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (!document.querySelector(`script[data-ga-loader="${MEASUREMENT_ID}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    script.setAttribute("data-ga-loader", MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  // ページビューはSPAのタブ切り替えに合わせて手動送信するため、自動送信はオフにする
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  initialized = true;
}

// タブ切り替え=ページ遷移とみなして送信する
export function trackPageView(pagePath, pageTitle) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  });
}

// PDF出力・SNS共有・プラン保存など、利用状況を把握したい操作を送信する
export function trackEvent(action, params = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params);
}
