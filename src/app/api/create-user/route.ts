import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { createUser } from '@/lib/firestore';

export async function POST(request: NextRequest) {
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
    
    // リクエストボディからユーザー情報を取得
    const userData = await request.json();
    
    // UIDが一致するかチェック（改ざん防止）
    if (userData.uid && userData.uid !== uid) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }
    
    // ユーザーを作成（UIDはトークンから取得したものを使用）
    await createUser(uid, {
      ...userData,
      uid: uid, // トークンから取得したUIDを使用
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'ユーザーが正常に作成されました',
      userId: uid 
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ユーザー作成に失敗しました' },
      { status: 500 }
    );
  }
} 