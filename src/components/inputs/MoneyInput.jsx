import React, { useState } from "react";

// 金額入力欄。編集中は生の数字、非編集時はカンマ区切りで表示する。
export default function MoneyInput({ value, onChange, max, className, style, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const display = editing ? text : value ? value.toLocaleString("ja-JP") : "0";
  return (
    <input
      type="text"
      inputMode="numeric"
      className={className || "ip-input"}
      style={style}
      placeholder={placeholder}
      value={display}
      onFocus={(e) => { setEditing(true); setText(value ? String(value) : ""); e.target.select(); }}
      onBlur={() => setEditing(false)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        let num = raw === "" ? 0 : parseInt(raw, 10);
        if (max != null && num > max) num = max;
        setText(num === 0 ? "" : String(num));
        onChange(num);
      }}
    />
  );
}
