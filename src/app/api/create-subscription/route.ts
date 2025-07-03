import { NextRequest, NextResponse } from 'next/server';
import { stripe, plans } from '@/lib/stripe';
import { createContract } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerId, 
      userId, 
      planId, 
      applicantType,
      customerName,
      companyName,
      customerEmail,
      hasOpenAIProxy, 
      selectedApps,
      paymentIntentId
    } = body;

    if (!customerId || !userId) {
      return NextResponse.json(
        { error: 'Customer IDまたはUser IDが必要です' },
        { status: 400 }
      );
    }

    console.log('Create subscription request:', { 
      customerId,
      userId,
      planId, 
      applicantType,
      customerName,
      hasOpenAIProxy, 
      selectedApps: selectedApps?.length || 0,
      paymentIntentId
    });

    // 保存済みの支払い方法を取得
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    if (!paymentMethods.data.length) {
      return NextResponse.json(
        { error: '支払い方法が見つかりません' },
        { status: 400 }
      );
    }

    const defaultPaymentMethod = paymentMethods.data[0].id;
    console.log('💳 Using payment method for subscription:', defaultPaymentMethod);

    // 翌月1日の日付を計算
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    const billingCycleAnchor = Math.floor(nextMonth.getTime() / 1000);

    console.log('📅 Next billing date:', new Date(billingCycleAnchor * 1000).toISOString());

    // サブスクリプションアイテムを構築
    const subscriptionItems = [
      {
        price: 'price_1ReuZ9H4hsO7RxQ6BVGs7Q8W', // 基本プラン
      },
    ];
    
    // OpenAI Proxyが有効な場合のアイテムを追加
    if (hasOpenAIProxy) {
      subscriptionItems.push({
        price: 'price_1Reua8H4hsO7RxQ6ayFN7Zbo', // OpenAI API代行
      });
    }
    
    // 追加アプリが選択されている場合は追加
    if (selectedApps && selectedApps.length > 0) {
      subscriptionItems.push({
        price: 'price_1RgjIsH4hsO7RxQ6Vj734Aee', // アプリオプション
        quantity: selectedApps.length,
      } as any);
    }

    console.log('📦 Subscription items:', subscriptionItems);

    // 価格IDが存在するかチェック
    for (const item of subscriptionItems) {
      if (!item.price) {
        throw new Error(`Price ID is missing for subscription item: ${JSON.stringify(item)}`);
      }
      console.log('✅ Price ID to use:', item.price);
    }

    // サブスクリプションを作成
    console.log('🔄 Creating subscription with customer:', customerId);
    console.log('🔄 Payment method:', defaultPaymentMethod);
    console.log('🔄 Billing cycle anchor:', new Date(billingCycleAnchor * 1000).toISOString());
    
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: subscriptionItems,
      default_payment_method: defaultPaymentMethod,
      billing_cycle_anchor: billingCycleAnchor,
      proration_behavior: 'none',
      metadata: {
        isNewFlow: 'true', // 新フロー識別
        firebaseUserId: userId,
        userId: userId,
        planId: planId,
        applicantType: applicantType,
        hasOpenAIProxy: hasOpenAIProxy?.toString() || 'false',
        selectedApps: selectedApps?.join(',') || '',
        initialPaymentIntentId: paymentIntentId || '',
      },
    });

    console.log('✅ Subscription created:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      nextBilling: new Date(billingCycleAnchor * 1000).toISOString()
    });

    // プラン名を取得
    const selectedPlan = plans.find(plan => plan.id === planId);
    const planName = selectedPlan ? selectedPlan.name : '基本プラン';

    // Firestoreに契約データを保存
    try {
      await createContract({
        userId: userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        planId: planId,
        planName: planName,
        applicantType: applicantType as 'individual' | 'corporate',
        companyName: companyName || undefined,
        customerEmail: customerEmail,
        hasOpenAIProxy: !!hasOpenAIProxy,
        selectedApps: selectedApps || [],
        status: 'active',
        startDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Contract created in Firestore for user:', userId);
    } catch (error) {
      console.error('❌ Failed to create contract in Firestore:', error);
      // サブスクリプションは作成済みなので、エラーログのみで続行
    }

    return NextResponse.json({ 
      status: 'success',
      subscriptionId: subscription.id,
      nextBillingDate: new Date(billingCycleAnchor * 1000).toISOString(),
      message: `サブスクリプションが作成されました。次回課金日: ${new Date(billingCycleAnchor * 1000).toLocaleDateString('ja-JP')}`
    });
  } catch (error: any) {
    console.error('❌ Subscription creation failed:', error);
    console.error('❌ Error type:', error.type);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    let errorMessage = 'サブスクリプション作成でエラーが発生しました';
    if (error.code === 'card_declined') {
      errorMessage = 'カードが拒否されました。';
    } else if (error.code === 'customer_tax_location_invalid') {
      errorMessage = '税務情報が無効です。';
    } else if (error.code === 'resource_missing') {
      errorMessage = '価格設定が見つかりません。管理者にお問い合わせください。';
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe設定エラー: ${error.message}`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        code: error.code,
        type: error.type
      },
      { status: 500 }
    );
  }
} 