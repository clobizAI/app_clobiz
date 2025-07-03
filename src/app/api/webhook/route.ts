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
    case 'checkout.session.completed':
      console.log('💳 Processing checkout.session.completed');
      const session = event.data.object as Stripe.Checkout.Session;
      
      try {
        console.log('🔍 Retrieving full session details...');
        // セッションの詳細情報を取得
        const fullSession = await stripe.checkout.sessions.retrieve(
          session.id,
          {
            expand: ['customer', 'subscription'],
          }
        );

        console.log('📋 Full session metadata:', fullSession.metadata);

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
          addedApps
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
          addedApps
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

          // 契約を更新
          await updateContract(contractId, {
            selectedApps: updatedApps,
            stripeSubscriptionId: (fullSession.subscription as Stripe.Subscription)?.id,
            updatedAt: new Date().toISOString(),
          });

          console.log('✅ Apps added to contract:', {
            contractId,
            addedApps: newApps,
            totalApps: updatedApps.length
          });
          
          break;
        }
        
        // 新規契約の場合の処理
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
            applicantType: (applicantType as 'individual' | 'corporate') || 'individual',
            companyName: companyName || undefined,
            passwordSetupRequired: true, // 自動作成のためパスワード設定が必要
            createdAt: new Date().toISOString(),
          });
          console.log('✅ Auto-created user record for checkout:', userId);
        }

        console.log('📄 Creating subscription for future billing...');
        // 翌月1日開始のサブスクリプションを作成
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        const billingCycleAnchor = Math.floor(nextMonth.getTime() / 1000);

        const customerId = typeof fullSession.customer === 'string'
          ? fullSession.customer
          : (fullSession.customer as any)?.id;

        // サブスクリプション用のアイテムを構築
        const subscriptionItems = [
          {
            price: 'price_1ReuZ9H4hsO7RxQ6BVGs7Q8W', // 基本プラン
            quantity: 1,
          },
        ];

        // OpenAI API代行が選択されている場合は追加
        if (hasOpenAIProxy === 'true') {
          subscriptionItems.push({
            price: 'price_1Reua8H4hsO7RxQ6ayFN7Zbo', // OpenAI API代行
            quantity: 1,
          });
        }

        // 追加アプリが選択されている場合は追加
        if (selectedApps) {
          const appsCount = selectedApps.split(',').filter(app => app).length;
          if (appsCount > 0) {
            subscriptionItems.push({
              price: appOption.stripePriceId, // アプリオプション400の価格ID
              quantity: appsCount, // 選択したアプリの数
            });
          }
        }

        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: subscriptionItems,
          billing_cycle_anchor: billingCycleAnchor,
          metadata: {
            contractType: 'basic',
            planId: planId,
            customerEmail: customerEmail,
            hasOpenAIProxy: hasOpenAIProxy || 'false',
            selectedApps: selectedApps || '',
          },
        });

        console.log('📄 Creating contract for user:', userId);
        // 契約情報を作成
        await createContract({
          userId: userId,
          planId: planId,
          planName: planId === 'basic' ? '基本プラン' : planId,
          status: 'active' as const,
          startDate: new Date().toISOString(),
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          contractPdfUrl: `https://example.com/contracts/${userId}.pdf`, // 仮のURL
          hasOpenAIProxy: hasOpenAIProxy === 'true',
          selectedApps: selectedApps ? selectedApps.split(',') : [],
          applicantType: (applicantType as 'individual' | 'corporate') || 'individual',
          companyName: companyName || undefined,
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