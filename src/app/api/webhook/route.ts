import { NextRequest, NextResponse } from 'next/server';
import { stripe, appOption } from '@/lib/stripe';
import { createContract, createUser, getUserByEmail, getContractById, updateContract } from '@/lib/firestore';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  console.log('🔄 Webhook received');
  


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
    case 'payment_intent.succeeded':
      console.log('🎯 Processing payment_intent.succeeded');
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // 新フローの初回決済完了を確認
      const isNewFlowPayment = paymentIntent.metadata?.isNewFlow === 'true';
      
      if (isNewFlowPayment) {
        console.log('✅ NEW FLOW: Step 2 - Initial payment completed successfully');
        console.log('💰 Payment details:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: paymentIntent.customer,
          firebaseUserId: paymentIntent.metadata?.firebaseUserId
        });
        console.log('🔄 Next: Subscription will be created via API');
      } else {
        console.log('💰 Legacy payment successful:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: paymentIntent.customer
        });
      }
      // 新フローではAPIで処理済みのため、webhookでは記録のみ
      break;

    case 'customer.subscription.created':
      console.log('🎯 Processing customer.subscription.created');
      const subscription = event.data.object as Stripe.Subscription;
      
      // 新フローのサブスクリプション作成を確認
      const isNewFlowSubscription = subscription.metadata?.isNewFlow === 'true';
      
      if (isNewFlowSubscription) {
        console.log('✅ NEW FLOW: Step 3 - Subscription created successfully');
        console.log('📅 Subscription details:', {
          id: subscription.id,
          status: subscription.status,
          customer: subscription.customer,
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          firebaseUserId: subscription.metadata?.firebaseUserId
        });
      } else {
        console.log('📅 Legacy subscription created:', {
          id: subscription.id,
          status: subscription.status,
          customer: subscription.customer
        });
      }
      // 新フローではAPIで処理済みのため、webhookでは記録のみ
      break;

    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('🎯 Processing checkout.session.completed');
      console.log('🎯 Session ID:', session.id);
      console.log('🎯 Session mode:', session.mode);
      console.log('🎯 Payment status:', session.payment_status);
      
      // Setup mode の場合はカード情報保存完了（新フロー：Step 1完了）
      if (session.mode === 'setup') {
        console.log('✅ NEW FLOW: Step 1 - Card information saved successfully');
        console.log('💳 Setup Intent ID:', session.setup_intent);
        console.log('🔄 Next: Initial payment will be processed via API');
        // 新フローではAPIで処理済みのため、webhookでは記録のみ
        break;
      }
      
      // Payment mode の場合はレガシーフローとして処理
      console.log('⚠️ LEGACY FLOW: Processing payment mode session...');
      console.log('ℹ️ Note: New flow uses setup mode instead of payment mode');
      
      try {
        // セッションの詳細を取得
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['customer', 'payment_intent']
        });
        console.log('🎯 Retrieved full session');
        console.log('🎯 Full session keys:', Object.keys(fullSession));
        console.log('🎯 Payment intent:', fullSession.payment_intent);
        console.log('🎯 Customer:', fullSession.customer);
        
        const { 
          type,
          planId, 
          applicantType,
          customerName,
          companyName, 
          customerEmail, 
          hasOpenAIProxy, 
          selectedApps,
          contractId,
          addedApps,
          userId
        } = fullSession.metadata || {};
        
        console.log('🏷️ Extracted metadata:', {
          type,
          planId,
          applicantType,
          customerName,
          companyName,
          customerEmail,
          hasOpenAIProxy,
          selectedApps,
          contractId,
          addedApps,
          userId
        });
        
        // アプリ追加の場合の処理
        if (type === 'app_addition') {
          console.log('➕ Processing app addition');
          
          if (!contractId || !addedApps) {
            console.error('❌ Missing contractId or addedApps in app addition:', {
              contractId: !!contractId,
              addedApps: !!addedApps
            });
            break;
          }

          // 既存契約を取得
          const existingContract = await getContractById(contractId);
          if (!existingContract) {
            console.error('❌ Contract not found:', contractId);
            break;
          }

          // 新しいアプリリストを作成
          const currentApps = existingContract.selectedApps || [];
          const newApps = addedApps.split(',');
          const updatedApps = [...currentApps, ...newApps];

          // 契約を更新（アプリ追加のみ、サブスクリプション更新は月次バッチで処理）
          await updateContract(contractId, {
            selectedApps: updatedApps,
            updatedAt: new Date().toISOString(),
          });

          console.log('✅ Apps added to contract:', {
            contractId,
            addedApps: newApps,
            totalApps: updatedApps.length
          });
          
          break;
        }
        
        // 新規契約の場合の処理（レガシーフローのみ）
        if (!planId || !customerName || !customerEmail || !userId) {
          console.error('❌ Missing metadata in checkout session:', {
            planId: !!planId,
            customerName: !!customerName,
            customerEmail: !!customerEmail,
            userId: !!userId
          });
          console.log('⚠️ This appears to be from the old flow or incomplete data');
          break;
        }
        
        console.log('📋 Processing legacy checkout session...');

        console.log('👤 Using Firebase UID for user:', userId);
        
        // Firebase UIDを使用（既存のFirestoreユーザー検索は不要）
        const firebaseUserId = userId;

        console.log('📄 Creating subscription for future billing...');
        
        // checkout sessionから支払い方法を取得
        const paymentIntentId = fullSession.payment_intent;
        let defaultPaymentMethod = null;
        
        console.log('🔍 Payment intent ID:', paymentIntentId);
        console.log('🔍 Full session data:', JSON.stringify(fullSession, null, 2));
        
        if (paymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId as string);
          console.log('🔍 Payment intent data:', JSON.stringify(paymentIntent, null, 2));
          
          const paymentMethod = paymentIntent.payment_method;
          defaultPaymentMethod = typeof paymentMethod === 'string' ? paymentMethod : paymentMethod?.id;
          console.log('💳 Retrieved payment method:', defaultPaymentMethod);
        } else {
          console.log('❌ No payment intent found in session');
        }
        
        // 翌月1日の日付を計算
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        const billingCycleAnchor = Math.floor(nextMonth.getTime() / 1000);
        
        // customerIdを取得
        let customerId = typeof fullSession.customer === 'string'
          ? fullSession.customer
          : (fullSession.customer as any)?.id;
          
        if (!customerId) {
          console.error('❌ No customer ID found in checkout session');
          console.error('❌ Session customer data:', fullSession.customer);
          break;
        }
        
        console.log('👤 Using existing Stripe customer from checkout:', customerId);

        // OpenAI Proxyが有効な場合のアイテムを追加
        const subscriptionItems = [
          {
            price: 'price_1ReuZ9H4hsO7RxQ6BVGs7Q8W', // 基本プラン
          },
        ];
        
        if (hasOpenAIProxy === 'true') {
          subscriptionItems.push({
            price: 'price_1Reua8H4hsO7RxQ6ayFN7Zbo', // OpenAI API代行
          });
        }
        
        // 追加アプリが選択されている場合は追加
        if (selectedApps) {
          const appsCount = selectedApps.split(',').filter(app => app).length;
          for (let i = 0; i < appsCount; i++) {
            subscriptionItems.push({
              price: appOption.stripePriceId, // アプリオプション400の価格ID
            });
          }
        }
        
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: subscriptionItems,
          billing_cycle_anchor: billingCycleAnchor,
          proration_behavior: 'none',
          default_payment_method: defaultPaymentMethod || undefined,
          metadata: {
            planId: planId,
            hasOpenAIProxy: hasOpenAIProxy || 'false',
            selectedApps: selectedApps || '',
          },
        });

        console.log('📄 Creating contract for user:', firebaseUserId);
        // 契約情報を作成
        await createContract({
          userId: firebaseUserId,
          planId: planId,
          planName: planId === 'basic' ? '基本プラン' : planId,
          status: 'active' as const,
          startDate: new Date().toISOString(),
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          contractPdfUrl: `https://example.com/contracts/${firebaseUserId}.pdf`, // 仮のURL
          hasOpenAIProxy: hasOpenAIProxy === 'true',
          selectedApps: selectedApps ? selectedApps.split(',') : [],
          applicantType: (applicantType as 'individual' | 'corporate') || 'individual',
          companyName: companyName || undefined,
          passwordSetupRequired: false, // 新規作成の場合はパスワード設定が不要
          customerEmail: customerEmail, // メールアドレスでの検索用
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log('🎉 Contract created successfully for user:', firebaseUserId);
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