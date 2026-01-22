// src/app/api/expenses/route.ts
import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

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

// GET: データ取得
export async function GET() {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        const expenses = rows.map((row) => ({
            // ★修正: rowNumberを使用 (Google Sheets APIの確実な行番号)
            rowNumber: row.rowNumber,
            date: row.get('日付') || '',
            amount: parseInt(row.get('金額') || '0', 10),
            description: row.get('内容') || '',
            genre: row.get('ジャンル') || '',
        }));

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

        // 全行取得
        const rows = await sheet.getRows();

        // ★修正: rowNumber で対象の行を探す
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