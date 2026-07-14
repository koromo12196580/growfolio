// 認証まわりの処理をまとめたファイル。
// 今はSupabaseを使わず、localStorageで簡易的にログイン状態を再現するスタブ実装になっているが、
// 関数のシグネチャ(引数・戻り値の形)はSupabase Authに合わせてあるため、
// 本番導入時はこのファイルの中身だけを @supabase/supabase-js の呼び出しに差し替えれば、
// 呼び出し側(AuthContext.jsx / LoginScreen.jsx)はほぼ変更せずに済む。
//
// Supabase移行時のイメージ:
//   import { createClient } from "@supabase/supabase-js";
//   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
//   export async function signInWithGoogle() {
//     return supabase.auth.signInWithOAuth({ provider: "google" });
//   }
//   export async function signInWithEmail(email, password) {
//     return supabase.auth.signInWithPassword({ email, password });
//   }
//   ...

const SESSION_KEY = "firemap:auth-session";
const listeners = new Set();

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  listeners.forEach((cb) => cb(session ? session.user : null));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

// 現在ログイン中のユーザーを取得する(未ログインならnull)
export async function getCurrentUser() {
  const session = readSession();
  return session ? session.user : null;
}

// Googleログイン(スタブ:実際にはSupabaseのOAuthリダイレクトに置き換える)
export async function signInWithGoogle() {
  const user = { id: "demo-google-user", email: "demo.google@firemap.local", provider: "google", name: "Googleデモユーザー" };
  writeSession({ user });
  return { user, error: null };
}

// メールアドレスでログイン(スタブ:実際にはSupabaseのパスワード認証に置き換える)
export async function signInWithEmail(email, password) {
  if (!isValidEmail(email)) return { user: null, error: "メールアドレスの形式が正しくありません。" };
  if (!password || password.length < 4) return { user: null, error: "パスワードは4文字以上で入力してください。" };
  const user = { id: `email-${email}`, email, provider: "email", name: email.split("@")[0] };
  writeSession({ user });
  return { user, error: null };
}

// メールアドレスで新規登録(スタブ)
export async function signUpWithEmail(email, password) {
  return signInWithEmail(email, password);
}

// ログアウト
export async function signOut() {
  writeSession(null);
}

// ログイン状態の変化を購読する。戻り値の関数を呼ぶと購読解除できる。
export function onAuthStateChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
