import React, { useState } from "react";

// 自由入力の利回り(小数)。取り崩し方法の「定率」など、プルダウン化していない箇所で使用。
export default function RateInput({ value, onChange, className, style, min = 0, max = 1 }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const display = editing ? text : value || value === 0 ? String(value) : "0";
  return (
    <input
      type="text"
      inputMode="decimal"
      className={className || "ip-input"}
      style={style}
      value={display}
      onFocus={(e) => { setEditing(true); setText(value ? String(value) : ""); e.target.select(); }}
      onBlur={() => setEditing(false)}
      onChange={(e) => {
        let raw = e.target.value.replace(/[^0-9.]/g, "");
        const parts = raw.split(".");
        if (parts.length > 2) raw = parts[0] + "." + parts.slice(1).join("");
        setText(raw);
        let num = raw === "" || raw === "." ? 0 : parseFloat(raw);
        if (isNaN(num)) num = 0;
        if (min != null && num < min) num = min;
        if (max != null && num > max) num = max;
        onChange(num);
      }}
    />
  );
}
