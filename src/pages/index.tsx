import React from "react";
import App from "../App";
// import "./index.css"; // グローバルCSS（TailwindやリセットCSSなど）

// firebase の初期化ファイルをインポート（実際の設定は firebase.ts にある想定）
import "../lib/firebase";

const Home = () => {
  return (
    <div>
      <App />
    </div>
  );
};

export default Home;