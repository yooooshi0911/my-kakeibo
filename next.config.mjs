import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public', // サービスワーカーの出力先
  register: true, // 自動登録
  skipWaiting: true, // 新しいバージョンがあればすぐに更新
  disable: process.env.NODE_ENV === 'development', // 開発環境では無効化してデバッグしやすくする
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ここに他のNext.jsの設定があれば追加
};

export default withPWA(nextConfig);