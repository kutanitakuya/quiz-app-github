import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";
import "./index.css"; // グローバルCSS（TailwindやリセットCSSなど）

// firebase の初期化ファイルをインポート（実際の設定は firebase.ts にある想定）
import "./firebase";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);