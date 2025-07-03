'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { businessApps, openaiProxyService, plans } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'

function SuccessContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URLパラメータを取得
  const step = searchParams.get('step') || 'final'
  const customerId = searchParams.get('customer_id')
  const userId = searchParams.get('userId')
  const planId = searchParams.get('plan')
  const applicantType = searchParams.get('applicantType')
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const companyName = searchParams.get('companyName')
  const hasOpenAIProxy = searchParams.get('hasOpenAIProxy') === 'true'
  const selectedAppsParam = searchParams.get('selectedApps')
  
  const selectedApps = useMemo(() => {
    return selectedAppsParam ? selectedAppsParam.split(',').filter(app => app) : []
  }, [selectedAppsParam])

  const [currentStep, setCurrentStep] = useState<'setup' | 'payment' | 'subscription' | 'completed' | 'error'>('setup')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [subscriptionResult, setSubscriptionResult] = useState<any>(null)

  const selectedPlan = plans.find(plan => plan.id === planId)

  useEffect(() => {
    if (step === 'setup' && customerId && userId) {
      processPaymentFlow()
    } else {
      setLoading(false)
      setCurrentStep('completed')
    }
  }, [step, customerId, userId])

  const processPaymentFlow = async () => {
    try {
      setCurrentStep('setup')
      setLoading(true)

      // Step 2: 初回決済を実行
      console.log('🔄 Starting initial payment...')
      setCurrentStep('payment')
      
      const paymentResponse = await fetch('/api/initial-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          planId: planId,
          hasOpenAIProxy: hasOpenAIProxy,
          selectedApps: selectedApps,
          firebaseUserId: userId, // webhook識別用
        }),
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        throw new Error(`初回決済エラー: ${errorData.error}`)
      }

      const paymentData = await paymentResponse.json()
      setPaymentResult(paymentData)
      console.log('✅ Initial payment completed:', paymentData)

      // Step 3: サブスクリプション作成
      console.log('🔄 Creating subscription...')
      setCurrentStep('subscription')

      const subscriptionResponse = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          userId: userId,
          planId: planId,
          applicantType: applicantType,
          customerName: name,
          companyName: companyName,
          customerEmail: email,
          hasOpenAIProxy: hasOpenAIProxy,
          selectedApps: selectedApps,
          paymentIntentId: paymentData.paymentIntentId,
        }),
      })

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json()
        throw new Error(`サブスクリプション作成エラー: ${errorData.error}`)
      }

      const subscriptionData = await subscriptionResponse.json()
      setSubscriptionResult(subscriptionData)
      console.log('✅ Subscription created:', subscriptionData)

      // 完了
      setCurrentStep('completed')
      setLoading(false)
    } catch (error: any) {
      console.error('❌ Payment flow error:', error)
      setError(error.message)
      setCurrentStep('error')
      setLoading(false)
    }
  }

  // プログレス表示
  const renderProgress = () => {
    const steps = [
      { key: 'setup', label: 'カード情報保存', icon: '💳' },
      { key: 'payment', label: '初回決済', icon: '💰' },
      { key: 'subscription', label: 'サブスクリプション', icon: '🔄' },
      { key: 'completed', label: '完了', icon: '🎉' }
    ]

    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {steps.map((stepItem, index) => (
            <div key={stepItem.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: getCurrentStepIndex() >= index 
                  ? (getCurrentStepIndex() === index ? 'var(--primary-500)' : 'var(--success-500)')
                  : 'var(--gray-300)',
                color: 'white',
                fontSize: '1.25rem',
                transition: 'all 0.3s ease'
              }}>
                {getCurrentStepIndex() > index ? '✅' : stepItem.icon}
              </div>
              <span style={{
                marginLeft: '0.5rem',
                fontSize: '0.875rem',
                color: getCurrentStepIndex() >= index ? 'var(--gray-900)' : 'var(--gray-500)',
                fontWeight: getCurrentStepIndex() === index ? '600' : '400'
              }}>
                {stepItem.label}
              </span>
              {index < steps.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: getCurrentStepIndex() > index ? 'var(--success-500)' : 'var(--gray-300)',
                  margin: '0 1rem',
                  transition: 'all 0.3s ease'
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getCurrentStepIndex = () => {
    switch (currentStep) {
      case 'setup': return 0
      case 'payment': return 1
      case 'subscription': return 2
      case 'completed': return 3
      case 'error': return 1 // エラー時は現在のステップを維持
      default: return 0
    }
  }

  // エラー表示
  if (currentStep === 'error') {
    return (
      <div className="page-container fade-in">
        <div className="form-container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--error-600)', marginBottom: '0.5rem' }}>
              ❌ エラーが発生しました
            </h1>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
              申込処理中にエラーが発生しました。
            </p>
            <div style={{
              background: 'var(--red-50)',
              border: '1px solid var(--red-200)',
              color: 'var(--red-800)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem'
            }}>
              {error}
            </div>
          </div>
          
          {renderProgress()}
          
          <div style={{ textAlign: 'center' }}>
            <Link href="/" className="btn btn-primary">
              🏠 ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 処理中表示
  if (loading || currentStep !== 'completed') {
    return (
      <div className="page-container fade-in">
        <div className="form-container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-600)', marginBottom: '0.5rem' }}>
              🔄 申込処理中...
            </h1>
            <p style={{ color: 'var(--gray-600)' }}>
              しばらくお待ちください。処理には1〜2分程度かかります。
            </p>
          </div>
          
          {renderProgress()}
          
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '2rem' }}>
              ⚪
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>
              {currentStep === 'setup' && 'カード情報を確認中...'}
              {currentStep === 'payment' && '初回決済を処理中...'}
              {currentStep === 'subscription' && 'サブスクリプションを作成中...'}
            </p>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // 完了表示
  const totalPrice = (selectedPlan?.price || 800) + 
                   (selectedApps.length * 400) + 
                   (hasOpenAIProxy ? 200 : 0)

  return (
    <div className="page-container fade-in">
      <div className="form-container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            background: 'var(--success-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2rem'
          }}>
            🎉
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success-600)', marginBottom: '0.5rem' }}>
            申込完了！
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            {name}様、AI業務アプリサービスへのお申し込みありがとうございます！
          </p>
        </div>

        {renderProgress()}

        <div style={{
          background: 'var(--gray-50)',
          border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
            📋 申込内容
          </h2>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gray-600)' }}>📦 プラン</span>
              <span style={{ fontWeight: '600' }}>{selectedPlan?.name || '基本プラン'}</span>
            </div>
            
            {hasOpenAIProxy && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-600)' }}>🔒 OpenAI API代行</span>
                <span style={{ fontWeight: '600' }}>あり (+HK$200)</span>
              </div>
            )}
            
            {selectedApps.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-600)' }}>🎯 追加アプリ</span>
                <span style={{ fontWeight: '600' }}>{selectedApps.length}個 (+HK${selectedApps.length * 400})</span>
              </div>
            )}
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--gray-300)', margin: '0.5rem 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem' }}>
              <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>💰 月額料金</span>
              <span style={{ fontWeight: '700', color: 'var(--primary-600)' }}>HK${totalPrice}</span>
            </div>
            
            {paymentResult && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-600)' }}>💳 初回決済</span>
                <span style={{ fontWeight: '600', color: 'var(--success-600)' }}>✅ 完了 (HK${paymentResult.amount})</span>
              </div>
            )}
            
            {subscriptionResult && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-600)' }}>📅 次回課金日</span>
                <span style={{ fontWeight: '600' }}>
                  {new Date(subscriptionResult.nextBillingDate).toLocaleDateString('ja-JP')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <p style={{ color: 'var(--primary-800)', fontSize: '0.875rem', margin: 0 }}>
            📧 設定完了通知とアクセス情報を <strong>{email}</strong> に送信いたします。<br />
            🚀 サーバー環境の構築には1〜2営業日かかります。準備完了次第ご連絡いたします。
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/mypage" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            📊 マイページへ
          </Link>
          <Link href="/" className="btn btn-secondary">
            🏠 ホームへ
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '2rem' }}>⚪</div>
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>読み込み中...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
} 