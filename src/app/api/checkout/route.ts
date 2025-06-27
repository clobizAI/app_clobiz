import { NextRequest, NextResponse } from 'next/server';
import { stripe, plans, openaiProxyService, isDemoMode } from '@/lib/stripe';
import { ApplicationForm } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ApplicationForm = await request.json();
    const { name, email, planId, hasOpenAIProxy, selectedApps } = body;

    // プラン情報を取得
    const selectedPlan = plans.find(plan => plan.id === planId);
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // 合計金額計算
    const basePrice = selectedPlan.price;
    const proxyPrice = hasOpenAIProxy ? openaiProxyService.price : 0;
    const totalPrice = basePrice + proxyPrice;

    console.log('Checkout request:', { 
      name, 
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
        email: email,
        name: name,
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

    // ライン アイテムを構築
    const lineItems = [
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
        customerName: name,
        customerEmail: email,
        hasOpenAIProxy: hasOpenAIProxy.toString(),
        selectedApps: selectedApps.join(','),
        totalPrice: totalPrice.toString(),
      },
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&hasOpenAIProxy=${hasOpenAIProxy}&selectedApps=${encodeURIComponent(selectedApps.join(','))}`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`,
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