import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// 認証設定 (expensesと同じ)
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getDoc() {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

// GET: ジャンル設定を取得
export async function GET() {
  try {
    const doc = await getDoc();
    // シート名 "Config" を探す
    let sheet = doc.sheetsByTitle['Config'];
    
    // もしシートがなければエラーではなくデフォルトを返す
    if (!sheet) {
      return NextResponse.json({ genres: [] });
    }

    const rows = await sheet.getRows();
    // A列 (ジャンル設定) の値を配列にする
    const genres = rows.map(row => row.get('ジャンル設定')).filter(Boolean);

    return NextResponse.json({ genres });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST: ジャンル設定を保存 (全書き換え)
export async function POST(req: Request) {
  try {
    const { genres } = await req.json(); // 新しいジャンルリストを受け取る
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle['Config'];

    if (!sheet) {
      return NextResponse.json({ error: 'Config sheet not found' }, { status: 404 });
    }

    // 今あるデータをクリアして書き直す
    await sheet.clearRows();
    
    // ヘッダー行を維持したい場合は残すが、今回は単純に全追加
    // ライブラリの仕様上、addRowsでオブジェクト配列を渡す
    const rowsToAdd = genres.map((g: string) => ({ 'ジャンル設定': g }));
    await sheet.addRows(rowsToAdd);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}