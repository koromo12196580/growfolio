import React, { useMemo } from "react";

// 0〜100歳、1〜70年などの整数値をプルダウンで選ばせる汎用コンポーネント。
// AgeSelectはこれを年齢用にラップしたもので、投資電卓の「年数」入力にもそのまま使う。
export default function IntegerSelect({ value, onChange, min = 0, max = 100, unit = "", className, style }) {
  const options = useMemo(() => Array.from({ length: max - min + 1 }, (_, i) => min + i), [min, max]);
  return (
    <select
      className={className || "ip-select"}
      style={style}
      value={Math.min(max, Math.max(min, value ?? min))}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {options.map((v) => (
        <option key={v} value={v}>{v}{unit}</option>
      ))}
    </select>
  );
}
