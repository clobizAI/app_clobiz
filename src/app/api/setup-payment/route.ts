import { NextRequest, NextResponse } from 'next/server';
import { stripe, plans, businessApps, openaiProxyService } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      applicantType, 
      name, 
      companyName, 
      email, 
      planId, 
      hasOpenAIProxy, 
      selectedApps, 
      userId 
    } = body;

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

    console.log('Setup payment request:', { 
      applicantType,
      name, 
      companyName,
      email, 
      planId, 
      hasOpenAIProxy, 
      selectedApps: selectedApps.length,
      userId
    });

    // ベースURLを環境変数から取得
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required');
    }

    console.log('📝 Creating Stripe customer for setup...');
    
    // Stripe customerを作成
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        userId: userId,
        applicantType: applicantType,
        companyName: companyName || '',
        planId: planId,
        hasOpenAIProxy: hasOpenAIProxy.toString(),
        selectedApps: selectedApps.join(','),
      },
    });
    
    console.log('✅ Created Stripe customer:', customer.id);

    // Setup session を作成（カード情報保存用）
    const setupSession = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customer.id,
      payment_method_types: ['card'],
      success_url: `${baseUrl}/success?step=setup&customer_id=${customer.id}&plan=${planId}&applicantType=${applicantType}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&companyName=${encodeURIComponent(companyName || '')}&hasOpenAIProxy=${hasOpenAIProxy}&selectedApps=${encodeURIComponent(selectedApps.join(','))}&userId=${userId}`,
      cancel_url: `${baseUrl}/setup-password?${new URLSearchParams({
        applicantType,
        name,
        companyName: companyName || '',
        email,
        planId,
        hasOpenAIProxy: hasOpenAIProxy.toString(),
        selectedApps: selectedApps.join(',')
      }).toString()}`,
      metadata: {
        step: 'setup',
        userId: userId,
        applicantType: applicantType,
        planId: planId,
        hasOpenAIProxy: hasOpenAIProxy.toString(),
        selectedApps: selectedApps.join(','),
      }
    });

    console.log('✅ Created setup session:', setupSession.id);

    return NextResponse.json({ 
      url: setupSession.url,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Setup payment session creation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 