import { NextRequest, NextResponse } from 'next/server';
import { getUserContractsByEmail } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'メールアドレスの形式が正しくありません' },
        { status: 400 }
      );
    }

    try {
      // 既存契約をチェック
      const existingContracts = await getUserContractsByEmail(email);
      const hasActiveContract = existingContracts.some(contract => 
        contract.status === 'active' || contract.status === 'pending'
      );

      if (hasActiveContract) {
        return NextResponse.json({
          exists: true,
          message: 'このメールアドレスは既にご契約済みです。ログインしてマイページをご利用ください。'
        });
      }

      return NextResponse.json({
        exists: false,
        message: 'このメールアドレスでお申し込みいただけます。'
      });
    } catch (firestoreError) {
      console.error('Error getting user contracts by email:', firestoreError);
      // Firestoreエラーの場合は、一時的に新規として扱う
      return NextResponse.json({
        exists: false,
        message: 'このメールアドレスでお申し込みいただけます。（確認機能は一時的に無効）'
      });
    }

  } catch (error) {
    console.error('Email check API error:', error);
    return NextResponse.json(
      { error: '確認中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 