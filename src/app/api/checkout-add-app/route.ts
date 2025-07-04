import { NextRequest, NextResponse } from 'next/server';
import { stripe, businessApps } from '@/lib/stripe';
import { getContractById, updateContract } from '@/lib/firestore';
import { verifyIdToken } from '@/lib/firebase-admin';

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

    const { contractId, selectedApps } = await request.json();

    if (!contractId || !selectedApps || !Array.isArray(selectedApps) || selectedApps.length === 0) {
      return NextResponse.json(
        { error: '契約IDと追加アプリが必要です' },
        { status: 400 }
      );
    }

    // 既存契約を取得
    const existingContract = await getContractById(contractId);
    if (!existingContract) {
      return NextResponse.json(
        { error: '契約が見つかりません' },
        { status: 404 }
      );
    }

    // 認可: UIDが契約のuserIdと一致するか
    if (existingContract.userId !== uid) {
      return NextResponse.json(
        { error: 'この契約を操作する権限がありません' },
        { status: 403 }
      );
    }

    // 有効な契約かチェック
    if (existingContract.status !== 'active') {
      return NextResponse.json(
        { error: '有効な契約ではありません' },
        { status: 400 }
      );
    }

    // Stripe Customer IDが存在するかチェック
    if (!existingContract.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Stripe顧客情報が見つかりません' },
        { status: 400 }
      );
    }

    // 既に契約済みのアプリを除外
    const currentApps = existingContract.selectedApps || [];
    const newApps = selectedApps.filter(appId => !currentApps.includes(appId));
    
    if (newApps.length === 0) {
      return NextResponse.json(
        { error: '選択されたアプリは既に契約済みです' },
        { status: 400 }
      );
    }

    // 追加アプリの詳細情報を取得
    const addedAppsInfo = newApps.map(appId => {
      const app = businessApps.find(a => a.id === appId);
      if (!app) {
        throw new Error(`アプリ ${appId} が見つかりません`);
      }
      return app;
    });

    // 追加料金を計算（各アプリHK$400）
    const totalAddPrice = newApps.length * 400;

    console.log('App addition payment request:', {
      contractId,
      customerId: existingContract.stripeCustomerId,
      newApps,
      totalPrice: totalAddPrice,
      userId: uid
    });

    // 保存済みの支払い方法を取得
    const paymentMethods = await stripe.paymentMethods.list({
      customer: existingContract.stripeCustomerId,
      type: 'card',
    });

    if (!paymentMethods.data.length) {
      return NextResponse.json(
        { error: '保存済みの支払い方法が見つかりません。カード情報を再度登録してください。' },
        { status: 400 }
      );
    }

    const paymentMethodId = paymentMethods.data[0].id;
    console.log('💳 Using saved payment method:', paymentMethodId);

    // PaymentIntent を作成して即時決済
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAddPrice * 100, // HKD cents
      currency: 'hkd',
      customer: existingContract.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true, // 保存済み支払い方法を使用
      confirm: true, // 即座に決済を実行
      description: `アプリ追加決済 - ${addedAppsInfo.map(app => app.name).join('、')}`,
      metadata: {
        type: 'app_addition',
        contractId: contractId,
        addedApps: newApps.join(','),
        userId: uid,
        totalPrice: totalAddPrice.toString(),
        appCount: newApps.length.toString(),
      },
    });

    console.log('✅ App addition payment completed:', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount
    });

    if (paymentIntent.status === 'succeeded') {
      // 即座にFirestoreを更新（webhookがバックアップ）
      try {
        const currentApps = existingContract.selectedApps || [];
        const updatedApps = [...currentApps, ...newApps];

        await updateContract(contractId, {
          selectedApps: updatedApps,
          updatedAt: new Date().toISOString(),
        });

        console.log('✅ Apps added to contract immediately:', {
          contractId,
          addedApps: newApps,
          totalApps: updatedApps.length,
          paymentIntentId: paymentIntent.id
        });
      } catch (firestoreError) {
        console.error('❌ Immediate Firestore update failed:', firestoreError);
        // Firestore更新に失敗してもwebhookで処理されるため、決済成功は返す
      }

      return NextResponse.json({ 
        status: 'success',
        paymentIntentId: paymentIntent.id,
        amount: totalAddPrice,
        addedApps: addedAppsInfo.map(app => app.name),
        message: `アプリ追加決済が完了しました（HK$${totalAddPrice}）`
      });
    } else {
      console.error('❌ Payment failed:', paymentIntent.status);
      return NextResponse.json(
        { 
          error: '決済が失敗しました',
          status: paymentIntent.status,
          paymentIntentId: paymentIntent.id
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('App addition payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アプリ追加決済に失敗しました' },
      { status: 500 }
    );
  }
} 