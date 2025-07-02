import { NextRequest, NextResponse } from 'next/server';
import { stripe, businessApps } from '@/lib/stripe';
import { getContractById } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const { contractId, selectedApps, userEmail } = await request.json();

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

    // 有効な契約かチェック
    if (existingContract.status !== 'active') {
      return NextResponse.json(
        { error: '有効な契約ではありません' },
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



    // Stripe Checkoutセッションを作成

    // ベースURLを環境変数から取得（必須）
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required');
    }

    console.log('Using base URL for redirects:', baseUrl);

    // ライン アイテムを構築（元のコードと同じ形式）
    const lineItems = [
      // 新規追加アプリのみ
      ...addedAppsInfo.map(app => ({
        price_data: {
          currency: 'hkd',
          product_data: {
            name: `${app.name} (追加)`,
            description: app.description,
          },
          unit_amount: 400 * 100, // HK$400 * 100 for cents
          recurring: {
            interval: 'month' as const,
          },
        },
        quantity: 1,
      }))
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      line_items: lineItems,
      metadata: {
        type: 'app_addition',
        contractId: contractId,
        addedApps: newApps.join(','),
      },
      success_url: `${baseUrl}/add-app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/add-app`,
    });

    console.log('Add-app checkout session created:', session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Add-app checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アプリ追加決済の作成に失敗しました' },
      { status: 500 }
    );
  }
} 