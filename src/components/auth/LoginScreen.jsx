import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";

// ログイン画面(カード単体)。Googleログインとメールアドレスログイン/新規登録の両方に対応。
// 保存機能を使いたいときにだけ表示される想定(シミュレーター自体はログインなしでも使える)。
export default function LoginScreen({ onSuccess }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const { error: err } = await signInWithGoogle();
    setLoading(false);
    if (err) setError(err);
    else onSuccess && onSuccess();
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fn = mode === "login" ? signInWithEmail : signUpWithEmail;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) setError(err);
    else onSuccess && onSuccess();
  };

  return (
    <div className="ip-card" style={{ maxWidth: 360, margin: "0 auto" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 4, textAlign: "center" }}>
        ログイン
      </div>
      <div className="ip-note" style={{ textAlign: "center", marginBottom: 16 }}>
        ログインすると、プランの保存・読み込みができるようになります。
      </div>

      <button className="ip-btn ip-btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: 12 }} onClick={handleGoogle} disabled={loading}>
        Googleでログイン
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", color: "var(--muted)", fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        または
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <form onSubmit={handleEmailSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label className="ip-input-label">メールアドレス</label>
          <input className="ip-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label className="ip-input-label">パスワード</label>
          <input className="ip-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="ip-note" style={{ color: "var(--warn)", marginBottom: 10 }}>{error}</div>}
        <button className="ip-btn" style={{ width: "100%", justifyContent: "center" }} type="submit" disabled={loading}>
          {mode === "login" ? "ログイン" : "新規登録"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <button
          className="ip-btn ip-btn-ghost"
          style={{ fontSize: 12, border: "none", background: "none" }}
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
        >
          {mode === "login" ? "アカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
        </button>
      </div>
    </div>
  );
}
