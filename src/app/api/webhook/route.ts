import { NextRequest, NextResponse } from 'next/server';
import { stripe, isDemoMode } from '@/lib/stripe';
import { createContract, createUser, getUserByEmail } from '@/lib/firestore';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  console.log('🔄 Webhook received');
  
  // デモモードの場合はwebhookを無効化
  if (isDemoMode || !stripe) {
    console.log('Demo mode: Webhook skipped');
    return NextResponse.json({ received: true, demo: true });
  }

  const sig = request.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  console.log('🔑 Webhook signature check:', { 
    hasSignature: !!sig, 
    hasSecret: !!webhookSecret 
  });

  if (!sig || !webhookSecret) {
    console.error('❌ Missing signature or webhook secret');
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    console.log('📝 Request body length:', body.length);
    event = stripe!.webhooks.constructEvent(body, sig, webhookSecret);
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log('🎯 Event type:', event.type);
  console.log('📊 Event data:', JSON.stringify(event.data, null, 2));

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      console.log('💳 Processing checkout.session.completed');
      const session = event.data.object as Stripe.Checkout.Session;
      
      try {
        console.log('🔍 Retrieving full session details...');
        // セッションの詳細情報を取得
        const fullSession = await stripe!.checkout.sessions.retrieve(
          session.id,
          {
            expand: ['customer', 'subscription'],
          }
        );

        console.log('📋 Full session metadata:', fullSession.metadata);

        const { 
          planId, 
          customerName, 
          customerEmail, 
          hasOpenAIProxy, 
          selectedApps 
        } = fullSession.metadata || {};
        
        console.log('🏷️ Extracted metadata:', {
          planId,
          customerName,
          customerEmail,
          hasOpenAIProxy,
          selectedApps
        });
        
        if (!planId || !customerName || !customerEmail) {
          console.error('❌ Missing metadata in checkout session:', {
            planId: !!planId,
            customerName: !!customerName,
            customerEmail: !!customerEmail
          });
          break;
        }

        console.log('🔍 Searching for existing user with email:', customerEmail);
        // メールアドレスで既存のFirestoreユーザーを検索
        let existingUser = await getUserByEmail(customerEmail);
        let userId: string;

        if (existingUser) {
          // 既存ユーザーが見つかった場合
          userId = existingUser.uid;
          console.log('👤 Found existing user:', userId);
        } else {
          // 新しいユーザーレコードを作成（申し込み時自動作成）
          userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
          console.log('➕ Creating new user with ID:', userId);
          
          await createUser(userId, {
            email: customerEmail,
            name: customerName,
            passwordSetupRequired: true, // 自動作成のためパスワード設定が必要
            createdAt: new Date().toISOString(),
          });
          console.log('✅ Auto-created user record for checkout:', userId);
        }

        console.log('📄 Creating contract for user:', userId);
        // 契約情報を作成
        await createContract({
          userId: userId,
          planId: planId,
          planName: planId === 'basic' ? '基本プラン' : planId,
          status: 'active' as const,
          startDate: new Date().toISOString(),
          stripeCustomerId: fullSession.customer as string,
          stripeSubscriptionId: (fullSession.subscription as Stripe.Subscription)?.id,
          contractPdfUrl: `https://example.com/contracts/${userId}.pdf`, // 仮のURL
          hasOpenAIProxy: hasOpenAIProxy === 'true',
          selectedApps: selectedApps ? selectedApps.split(',') : [],
          passwordSetupRequired: !existingUser, // 新規作成の場合はパスワード設定が必要
          customerEmail: customerEmail, // メールアドレスでの検索用
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log('🎉 Contract created successfully for user:', userId);
      } catch (error) {
        console.error('💥 Error processing checkout session:', error);
        console.error('💥 Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      break;

    case 'customer.subscription.updated':
      // サブスクリプション更新の処理
      console.log('🔄 Subscription updated:', event.data.object);
      break;

    case 'customer.subscription.deleted':
      // サブスクリプション削除の処理
      console.log('🗑️ Subscription deleted:', event.data.object);
      break;

    default:
      console.log(`❓ Unhandled event type ${event.type}`);
  }

  console.log('✅ Webhook processing completed');
  return NextResponse.json({ received: true });
} 