import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getCurrentUser, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, onAuthStateChange,
} from "./authClient.js";

// アプリ全体でログイン状態を共有するためのContext。
// 実際の認証処理はすべて authClient.js に分離してあるので、
// このファイルは状態管理(誰がログインしているか)だけを担当する。
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => { setUser(u); setLoading(false); });
    const unsubscribe = onAuthStateChange((u) => setUser(u));
    return unsubscribe;
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    const { user: u, error } = await signInWithGoogle();
    if (u) setUser(u);
    return { user: u, error };
  }, []);

  const handleSignInWithEmail = useCallback(async (email, password) => {
    const { user: u, error } = await signInWithEmail(email, password);
    if (u) setUser(u);
    return { user: u, error };
  }, []);

  const handleSignUpWithEmail = useCallback(async (email, password) => {
    const { user: u, error } = await signUpWithEmail(email, password);
    if (u) setUser(u);
    return { user: u, error };
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
