import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserContracts } from '@/lib/firestore';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
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
    const activeContract = contracts.find(c => c.status === 'active' && c.stripeCustomerId);
    
    if (!activeContract?.stripeCustomerId) {
      return NextResponse.json({ error: '有効な契約がありません' }, { status: 404 });
    }

    const customerId = activeContract.stripeCustomerId;

    // Stripe APIから支払い履歴を取得
    const [paymentIntents, invoices] = await Promise.all([
      // 即時決済履歴
      stripe.paymentIntents.list({
        customer: customerId,
        limit: 20,
        expand: ['data.charges']
      }),
      // サブスクリプション請求書
      stripe.invoices.list({
        customer: customerId,
        limit: 20,
        status: 'paid'
      })
    ]);

    // データを統合して時系列順にソート
    const allPayments = [
      ...paymentIntents.data.map(pi => ({
        id: pi.id,
        type: 'payment_intent' as const,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: pi.created,
        description: pi.description || '即時決済',
        receipt_url: (pi as any).charges?.data[0]?.receipt_url || null
      })),
      ...invoices.data.map(inv => ({
        id: inv.id,
        type: 'invoice' as const,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: inv.created,
        description: inv.description || 'サブスクリプション課金',
        receipt_url: inv.invoice_pdf || null
      }))
    ].sort((a, b) => b.created - a.created);

    return NextResponse.json({
      success: true,
      payments: allPayments,
      total: allPayments.length
    });

  } catch (error) {
    console.error('支払い履歴取得エラー:', error);
    return NextResponse.json(
      { error: '支払い履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
} 