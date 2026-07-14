import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getAdvice } from "../ai/aiClient.js";

// 入力内容に応じたアドバイスを表示するカード。
// 実際の判定ロジックは ai/adviceEngine.js に分離してあり、このコンポーネントは表示だけを担当する。
export default function AdviceCard({ context }) {
  const [advice, setAdvice] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getAdvice(context).then((result) => { if (!cancelled) setAdvice(result); });
    return () => { cancelled = true; };
  }, [context]);

  if (advice.length === 0) return null;

  return (
    <div className="ip-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Sparkles size={16} style={{ color: "var(--tsumitate)" }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>プランへのアドバイス</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {advice.map((text, i) => (
          <div key={i} style={{
            fontSize: 12.5, lineHeight: 1.7, background: "rgba(47,111,98,0.06)",
            border: "1px solid rgba(47,111,98,0.16)", borderRadius: 8, padding: "8px 12px",
          }}>
            {text}
          </div>
        ))}
      </div>
      <div className="ip-note" style={{ marginTop: 10 }}>
        ※ルールに基づく簡易的な参考情報です。個別の投資助言ではありません。
      </div>
    </div>
  );
}
