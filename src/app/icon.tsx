import { ImageResponse } from 'next/og';

// アイコンのサイズ設定
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// コードでアイコン画像を生成する
export default function Icon() {
  return new ImageResponse(
    (
      // ↓ ここに好きな絵文字や文字を入れることができます
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        👛
      </div>
    ),
    {
      ...size,
    }
  );
}