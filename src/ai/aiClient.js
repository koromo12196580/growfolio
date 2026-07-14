import { generateAdvice } from "./adviceEngine.js";

// AIアドバイスの呼び出し口。今はルールベースエンジンをそのまま使っているが、
// 将来OpenAI APIなど有料の生成AIに置き換える場合は、この関数の中身だけを
// fetch("/api/advice", { method: "POST", body: JSON.stringify(context) }) のような
// 呼び出しに差し替えれば、呼び出し側(AdviceCard.jsx)は変更不要になる想定。
export async function getAdvice(context) {
  return generateAdvice(context);
}
