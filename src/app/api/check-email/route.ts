import { NextRequest, NextResponse } from 'next/server';
import { getUserContractsByEmail } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  console.log('📧 Email check API called');
  
  try {
    const { email } = await request.json();
    console.log('📧 Received email:', email);

    if (!email) {
      console.log('❌ No email provided');
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json(
        { error: 'メールアドレスの形式が正しくありません' },
        { status: 400 }
      );
    }

    console.log('✅ Email format valid, checking contracts...');

    try {
      // 既存契約をチェック
      const existingContracts = await getUserContractsByEmail(email);
      console.log('📋 Existing contracts found:', existingContracts.length);
      
      const hasActiveContract = existingContracts.some(contract => 
        contract.status === 'active' || contract.status === 'pending'
      );

      if (hasActiveContract) {
        console.log('⚠️ Found existing contract for email:', email);
        return NextResponse.json({
          exists: true,
          message: 'このメールアドレスは既にご契約済みです。ログインしてマイページをご利用ください。'
        });
      }

      console.log('✅ No existing contract found for email:', email);
      return NextResponse.json({
        exists: false,
        message: 'このメールアドレスでお申し込みいただけます。'
      });
    } catch (firestoreError) {
      console.error('💥 Firestore error:', firestoreError);
      // Firestoreエラーの場合は、一時的に新規として扱う
      return NextResponse.json({
        exists: false,
        message: 'このメールアドレスでお申し込みいただけます。（確認機能は一時的に無効）'
      });
    }

  } catch (error) {
    console.error('💥 API error:', error);
    return NextResponse.json(
      { error: '確認中にエラーが発生しました: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 