'use client';

import { useState, useEffect } from 'react';

// 【魔法のコード】 ./loadings フォルダ内の .tsx ファイルを全て自動認識します
// @ts-ignore
const files = require.context('./loadings', false, /\.tsx$/);
const fileKeys = files.keys();

export default function Loading() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (fileKeys.length === 0) return;

    // 1. ランダムにファイル名を選ぶ
    const randomKey = fileKeys[Math.floor(Math.random() * fileKeys.length)];
    
    // 2. そのファイルを読み込む
    const module = files(randomKey);
    
    // 3. コンポーネントとしてセット
    setComponent(() => module.default);
  }, []);

  // 決まるまでは何も表示しない
  if (!Component) return null;

  return <Component />;
}