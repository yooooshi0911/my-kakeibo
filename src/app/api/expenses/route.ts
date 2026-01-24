import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// 環境変数の読み込み（元の設定のままでOK）
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getDoc() {
  // 元のコードに合わせて GOOGLE_SHEET_ID を使用
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

// GET: データ取得
export async function GET() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const expenses = rows.map((row) => {
      // 金額の文字列（例: "1,200.50"）からカンマを除去して数値化
      const amountStr = (row.get('金額') || '0').toString().replace(/,/g, '');
      // ★ここが修正点: parseInt ではなく parseFloat を使う
      const amount = parseFloat(amountStr);

      return {
        rowNumber: row.rowNumber,
        date: row.get('日付') || '',
        amount: isNaN(amount) ? 0 : amount, // 数値じゃない場合は0
        description: row.get('内容') || '',
        genre: row.get('ジャンル') || '',
      };
    });

    return NextResponse.json(expenses);
  } catch (e) {
    console.error('Fetch error:', e);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST: データ更新
export async function POST(req: Request) {
  try {
    const { rowNumber, genre, description } = await req.json();
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];

    // 全行取得して、行番号で検索
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.rowNumber === rowNumber);

    if (targetRow) {
      if (genre !== undefined) targetRow.set('ジャンル', genre);
      if (description !== undefined) targetRow.set('内容', description);

      await targetRow.save(); // 保存実行
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Row not found' }, { status: 404 });
  } catch (e) {
    console.error('Update error:', e);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}