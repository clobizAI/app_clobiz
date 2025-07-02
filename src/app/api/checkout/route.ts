import { NextRequest, NextResponse } from 'next/server';
import { stripe, plans, businessApps, openaiProxyService, isDemoMode } from '@/lib/stripe';
import { ApplicationForm } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ApplicationForm = await request.json();
    const { applicantType, name, companyName, email, planId, hasOpenAIProxy, selectedApps } = body;

    // プラン情報を取得
    const selectedPlan = plans.find(plan => plan.id === planId);
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // 合計金額計算：基本800 + アプリ×400 + API代行200
    const basePrice = selectedPlan.price;
    const appsPrice = selectedApps.length * 400; // 各アプリ400ドル
    const proxyPrice = hasOpenAIProxy ? openaiProxyService.price : 0;
    const totalPrice = basePrice + appsPrice + proxyPrice;

    console.log('Checkout request:', { 
      applicantType,
      name, 
      companyName,
      email, 
      planId, 
      hasOpenAIProxy, 
      selectedApps: selectedApps.length,
      selectedPlan,
      totalPrice 
    });
    console.log('Demo mode:', isDemoMode);

    // デモモードの場合はダミーURLを返す
    if (isDemoMode) {
      console.log('Running in demo mode - redirecting to success page');
      const params = new URLSearchParams({
        session_id: `cs_test_demo_${Date.now()}`,
        demo: 'true',
        plan: planId,
        applicantType: applicantType,
        email: email,
        name: name,
        companyName: companyName || '',
        hasOpenAIProxy: hasOpenAIProxy.toString(),
        selectedApps: selectedApps.join(',')
      });
      
      return NextResponse.json({ 
        url: `/success?${params.toString()}` 
      });
    }

    // 実際のStripe Checkoutセッションを作成
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    // ベースURLを環境変数から取得（必須）
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required');
    }

    console.log('Using base URL for redirects:', baseUrl);

    // ライン アイテムを構築
    const lineItems = [
      // 基本プラン
      {
        price_data: {
          currency: 'hkd',
          product_data: {
            name: `${selectedPlan.name}`,
            description: selectedPlan.features.join('、'),
          },
          unit_amount: selectedPlan.price * 100, // HKD cents
          recurring: {
            interval: 'month' as const,
          },
        },
        quantity: 1,
      },
    ];

    // 追加アプリが選択されている場合は追加
    if (selectedApps.length > 0) {
      lineItems.push({
        price_data: {
          currency: 'hkd',
          product_data: {
            name: `追加アプリ (${selectedApps.length}個)`,
            description: selectedApps.map(appId => {
              const app = businessApps.find(app => app.id === appId);
              return app ? app.name : appId;
            }).join('、'),
          },
          unit_amount: 400 * 100, // HKD cents
          recurring: {
            interval: 'month' as const,
          },
        },
        quantity: selectedApps.length,
      });
    }

    // OpenAI API代行が選択されている場合は追加
    if (hasOpenAIProxy) {
      lineItems.push({
        price_data: {
          currency: 'hkd',
          product_data: {
            name: openaiProxyService.name,
            description: openaiProxyService.description,
          },
          unit_amount: openaiProxyService.price * 100, // HKD cents
          recurring: {
            interval: 'month' as const,
          },
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: lineItems,
      metadata: {
        planId: planId,
        applicantType: applicantType,
        customerName: name,
        companyName: companyName || '',
        customerEmail: email,
        hasOpenAIProxy: hasOpenAIProxy.toString(),
        selectedApps: selectedApps.join(','),
        totalPrice: totalPrice.toString(),
        // 注意: 実際のFirebase UIDは別途認証チェックで取得する必要があります
        // 現在はメールアドレスをキーとして使用
        userKey: email,
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&applicantType=${applicantType}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&companyName=${encodeURIComponent(companyName || '')}&hasOpenAIProxy=${hasOpenAIProxy}&selectedApps=${encodeURIComponent(selectedApps.join(','))}`,
      cancel_url: `${baseUrl}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 