import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { getUserContracts } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    // AuthorizationヘッダーからIDトークンを取得
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証情報がありません' },
        { status: 401 }
      );
    }
    const idToken = authHeader.replace('Bearer ', '').trim();
    let decoded;
    try {
      decoded = await verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json(
        { error: 'IDトークンが無効です' },
        { status: 401 }
      );
    }
    const uid = decoded.uid;

    // UIDで自分の契約情報のみ取得
    const contracts = await getUserContracts(uid);
    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Error getting contracts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '契約情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 