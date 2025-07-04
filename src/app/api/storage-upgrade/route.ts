import { NextRequest, NextResponse } from 'next/server';
import { stripe, storagePlans } from '@/lib/stripe';
import { getContractById, updateContract } from '@/lib/firestore';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // AuthorizationヘッダーからIDトークンを取得
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証情報がありません' },
        { status: 401 }
      );
    }
    const idToken = authHeader.replace('Bearer ', '').trim();
    let decoded;
    try {
      decoded = await verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json(
        { error: 'IDトークンが無効です' },
        { status: 401 }
      );
    }
    const uid = decoded.uid;

    // クライアントからUIDやuserEmailは受け取らない
    const { contractId, newStoragePlan } = await request.json();
    if (!contractId || !newStoragePlan) {
      return NextResponse.json(
        { error: '契約IDと新しい容量プランが必要です' },
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

    // 認可: UIDが契約のuserIdと一致するか
    if (existingContract.userId !== uid) {
      return NextResponse.json(
        { error: 'この契約を操作する権限がありません' },
        { status: 403 }
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

    // 契約情報を更新（pendingStoragePlanのみ）
    await updateContract(contractId, {
      pendingStoragePlan: newStoragePlan,
      updatedAt: new Date().toISOString(),
    });

    console.log('Storage upgrade request completed:', {
      contractId,
      newStoragePlan,
      userId: uid,
      note: 'Stripe subscription will be updated on next billing cycle'
    });

    return NextResponse.json({
      success: true,
      message: '容量変更申請が完了しました。翌月1日から新しい容量でご利用いただけます。',
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