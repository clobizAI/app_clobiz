import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserContracts } from '@/lib/firestore';
import { verifyIdToken } from '@/lib/firebase-admin';

const RETURN_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000/mypage';

export async function POST(request: NextRequest) {
  try {
    // 認証
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
    }
    const idToken = authHeader.replace('Bearer ', '').trim();
    let decoded;
    try {
      decoded = await verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json({ error: 'IDトークンが無効です' }, { status: 401 });
    }
    const uid = decoded.uid;

    // FirestoreからStripe Customer IDを取得
    const contracts = await getUserContracts(uid);
    const active = contracts.find(c => c.status === 'active' && c.stripeCustomerId);
    if (!active) {
      return NextResponse.json({ error: '有効な契約がありません' }, { status: 404 });
    }
    const customerId = String(active.stripeCustomerId);

    // Stripeポータルセッション作成
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: RETURN_URL,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripeポータルセッション作成エラー:', error);
    return NextResponse.json({ error: 'ポータルセッション作成に失敗しました' }, { status: 500 });
  }
} 