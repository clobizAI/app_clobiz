import { NextRequest, NextResponse } from 'next/server';
import { stripe, storagePlans } from '@/lib/stripe';
import { getContractById, updateContract } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const { contractId, newStoragePlan, userEmail } = await request.json();

    if (!contractId || !newStoragePlan || !userEmail) {
      return NextResponse.json(
        { error: '契約ID、新しい容量プラン、ユーザーメールが必要です' },
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

    // 既に申請中の容量変更があるかチェック
    if (existingContract.pendingStoragePlan) {
      return NextResponse.json(
        { error: '既に容量変更申請が完了しています' },
        { status: 400 }
      );
    }

    // 新しい容量プランの詳細を取得
    const selectedPlan = storagePlans.find(plan => plan.id === newStoragePlan);
    if (!selectedPlan) {
      return NextResponse.json(
        { error: '指定された容量プランが見つかりません' },
        { status: 400 }
      );
    }

    // 現在の容量プランと同じかチェック
    const currentStoragePlan = existingContract.currentStoragePlan || '5gb';
    if (newStoragePlan === currentStoragePlan) {
      return NextResponse.json(
        { error: '現在と同じ容量プランです' },
        { status: 400 }
      );
    }

    // Stripeサブスクリプションの更新
    if (existingContract.stripeSubscriptionId) {
      try {
        console.log('Updating Stripe subscription:', existingContract.stripeSubscriptionId);
        
        // 既存のサブスクリプションを取得
        const subscription = await stripe.subscriptions.retrieve(existingContract.stripeSubscriptionId);
        
        // 容量プランのアイテムを追加（5GB以外の場合）
        if (selectedPlan.price > 0) {
          const subscriptionItems = [];
          
          // 既存のアイテムを保持
          for (const item of subscription.items.data) {
            subscriptionItems.push({
              id: item.id,
              price: item.price.id,
            });
          }
          
          // 新しい容量プランのアイテムを追加
          subscriptionItems.push({
            price: selectedPlan.stripePriceId,
            quantity: 1,
          });
          
          // サブスクリプションを更新
          await stripe.subscriptions.update(existingContract.stripeSubscriptionId, {
            items: subscriptionItems,
            metadata: {
              ...subscription.metadata,
              storageUpgrade: newStoragePlan,
              storageUpgradeDate: new Date().toISOString(),
            },
          });
          
          console.log('Stripe subscription updated successfully');
        }
      } catch (stripeError) {
        console.error('Stripe subscription update failed:', stripeError);
        return NextResponse.json(
          { error: 'サブスクリプションの更新に失敗しました' },
          { status: 500 }
        );
      }
    }

    // 契約情報を更新
    await updateContract(contractId, {
      pendingStoragePlan: newStoragePlan,
      updatedAt: new Date().toISOString(),
    });

    console.log('Storage upgrade request completed:', {
      contractId,
      newStoragePlan,
      userEmail
    });

    return NextResponse.json({
      success: true,
      message: '容量変更申請が完了しました',
      newStoragePlan: selectedPlan.name,
      effectiveDate: '翌月1日'
    });

  } catch (error) {
    console.error('Storage upgrade request error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '容量変更申請に失敗しました' },
      { status: 500 }
    );
  }
} 