import { NextRequest, NextResponse } from 'next/server';
import { stripe, plans, businessApps, openaiProxyService } from '@/lib/stripe';
import { ApplicationForm } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicantType, name, companyName, email, planId, hasOpenAIProxy, selectedApps, userId } = body

    // Firebase UIDの確認
    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
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
      totalPrice,
      userId
    });

    // ベースURLを環境変数から取得（必須）
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required');
    }

    console.log('Using base URL for redirects:', baseUrl);

    // Stripe customerを事前作成
    console.log('📝 Creating Stripe customer...');
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        userId: userId,
        applicantType: applicantType,
        companyName: companyName || '',
      },
    });
    console.log('✅ Created Stripe customer:', customer.id);

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
            description: selectedApps.map((appId: string) => {
              const app = businessApps.find(app => app.id === appId);
              return app ? app.name : appId;
            }).join('、'),
          },
          unit_amount: 400 * 100, // HKD cents
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
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customer.id,
      line_items: lineItems,
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      metadata: {
        planId: planId,
        applicantType: applicantType,
        customerName: name,
        companyName: companyName || '',
        customerEmail: email,
        hasOpenAIProxy: hasOpenAIProxy.toString(),
        selectedApps: selectedApps.join(','),
        totalPrice: totalPrice.toString(),
        userId: userId,
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