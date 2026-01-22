// src/utils.ts

// 基本のジャンル (これを外部で使えるように export します)
export const DEFAULT_GENRES = ['食費', '交通費', '日用品', '娯楽', '固定費', 'その他'];

// パステルカラーのパレット
const PASTEL_PALETTE = [
  '#93C5FD', '#6EE7B7', '#FDE047', '#FDBA74', '#C4B5FD', '#CBD5E1', 
  '#FECACA', '#A7F3D0', '#DDD6FE', '#FBCFE8', '#E2E8F0'
];

// 文字列から色を自動決定する関数
export const getGenreColor = (genre: string) => {
  if (!genre) return '#E2E8F0'; // 未分類の色
  
  // デフォルトジャンルなら固定色を返す
  const index = DEFAULT_GENRES.indexOf(genre);
  if (index !== -1) return PASTEL_PALETTE[index % PASTEL_PALETTE.length];

  // 新しいジャンルならハッシュ計算して色を決める
  let hash = 0;
  for (let i = 0; i < genre.length; i++) {
    hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % PASTEL_PALETTE.length;
  return PASTEL_PALETTE[colorIndex];
};

// 日付フォーマット (YYYY/MM/DD)
export const formatDateShort = (dateStr: string) => {
  if (!dateStr) return '';
  const match = dateStr.match(/(\d{4})[年\/](\d{1,2})[月\/](\d{1,2})/);
  if (match) {
    return `${match[2].padStart(2, '0')}/${match[3].padStart(2, '0')}`;
  }
  return dateStr.substring(5, 10).replace('-', '/');
};