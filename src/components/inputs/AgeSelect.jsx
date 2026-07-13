import React from "react";
import IntegerSelect from "./IntegerSelect.jsx";
import { MIN_AGE, MAX_AGE } from "../../constants.js";

// 年齢専用のプルダウン(0〜100歳・1歳刻み)。不正な値は選択できない。
export default function AgeSelect(props) {
  return <IntegerSelect min={MIN_AGE} max={MAX_AGE} unit="歳" {...props} />;
}
