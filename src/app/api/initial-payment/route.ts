import { NextRequest, NextResponse } from 'next/server';
import { stripe, plans, openaiProxyService } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, planId, hasOpenAIProxy, selectedApps, firebaseUserId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer IDが必要です' },
        { status: 400 }
      );
    }

    // プラン情報を取得
    const selectedPlan = plans.find(plan => plan.id === planId);
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    console.log('Initial payment request:', { 
      customerId,
      planId, 
      hasOpenAIProxy, 
      selectedApps: selectedApps?.length || 0
    });

    // 保存済みの支払い方法を取得
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    if (!paymentMethods.data.length) {
      return NextResponse.json(
        { error: '支払い方法が見つかりません。カード情報を再度登録してください。' },
        { status: 400 }
      );
    }

    const paymentMethodId = paymentMethods.data[0].id;
    console.log('💳 Using payment method:', paymentMethodId);

    // 合計金額計算：基本800 + アプリ×400 + API代行200
    const basePrice = selectedPlan.price;
    const appsPrice = (selectedApps?.length || 0) * 400;
    const proxyPrice = hasOpenAIProxy ? openaiProxyService.price : 0;
    const totalPrice = basePrice + appsPrice + proxyPrice;

    console.log('💰 Calculating total price:', {
      basePrice,
      appsPrice,
      proxyPrice,
      totalPrice
    });

    // PaymentIntent を作成して即時決済
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100, // HKD cents
      currency: 'hkd',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true, // 保存済み支払い方法を使用
      confirm: true, // 即座に決済を実行
      description: `初回決済 - ${selectedPlan.name}${hasOpenAIProxy ? ' + OpenAI API代行' : ''}${selectedApps?.length ? ` + アプリ ${selectedApps.length}個` : ''}`,
      metadata: {
        type: 'initial_payment',
        isNewFlow: 'true', // 新フロー識別
        firebaseUserId: firebaseUserId || '',
        planId: planId,
        hasOpenAIProxy: hasOpenAIProxy?.toString() || 'false',
        selectedApps: selectedApps?.join(',') || '',
        totalPrice: totalPrice.toString(),
      },
    });

    console.log('✅ Initial payment completed:', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount
    });

    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({ 
        status: 'success', 
        paymentIntentId: paymentIntent.id,
        amount: totalPrice,
        message: `初回決済が完了しました（HK$${totalPrice}）`
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
  } catch (error: any) {
    console.error('Initial payment failed:', error);
    
    let errorMessage = '初回決済でエラーが発生しました';
    if (error.code === 'card_declined') {
      errorMessage = 'カードが拒否されました。別のカードをお試しください。';
    } else if (error.code === 'insufficient_funds') {
      errorMessage = '残高不足です。';
    } else if (error.code === 'authentication_required') {
      errorMessage = 'カード認証が必要です。';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
} 