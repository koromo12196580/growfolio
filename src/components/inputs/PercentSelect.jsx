import React, { useMemo } from "react";

// 利回り・インフレ率用のプルダウン(0.5%刻み)。内部の値は小数(例: 0.05 = 5%)で保持する。
export default function PercentSelect({ value, onChange, maxPercent = 20, step = 0.5, className, style }) {
  const stepsCount = Math.round(maxPercent / step);
  const options = useMemo(() => Array.from({ length: stepsCount + 1 }, (_, i) => i), [stepsCount]);
  const currentIndex = Math.min(stepsCount, Math.max(0, Math.round(((value || 0) * 100) / step)));
  return (
    <select
      className={className || "ip-select"}
      style={style}
      value={currentIndex}
      onChange={(e) => {
        const idx = Number(e.target.value);
        onChange((idx * step) / 100);
      }}
    >
      {options.map((i) => {
        const pct = i * step;
        return <option key={i} value={i}>{pct}%</option>;
      })}
    </select>
  );
}
