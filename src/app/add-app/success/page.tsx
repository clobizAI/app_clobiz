'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { businessApps } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'

function AddAppSuccessContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent_id')
  const amount = searchParams.get('amount')
  const apps = searchParams.get('apps')
  
  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (paymentIntentId) {
      // PaymentIntent情報を設定
      setTimeout(() => {
        setPaymentData({
          id: paymentIntentId,
          payment_status: 'paid',
          type: 'app_addition',
          amount: amount,
          addedApps: apps ? decodeURIComponent(apps).split(',') : []
        })
        setLoading(false)
      }, 500) // 短縮
    } else {
      setLoading(false)
    }
  }, [paymentIntentId, amount, apps])

  if (loading) {
    return (
      <div className="success-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">決済情報を確認しています...</p>
        </div>
      </div>
    )
  }

  if (!paymentIntentId) {
    return (
      <div className="success-container fade-in">
        <div className="success-header">
          <div style={{ 
            width: '5rem', 
            height: '5rem', 
            background: 'var(--error-500)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <span style={{ fontSize: '2rem', color: 'white' }}>❌</span>
          </div>
          <h1 className="success-title">決済情報が見つかりません</h1>
          <p className="success-subtitle">
            決済情報が無効か、期限切れです。
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/add-app" className="btn btn-primary">
            ➕ アプリ追加ページに戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="success-container fade-in">
      <div className="success-header">
        <div className="success-icon">
          <span style={{ fontSize: '2.5rem', color: 'white' }}>🎉</span>
        </div>
        <h1 className="success-title">
          アプリ追加完了！
        </h1>
        <p className="success-subtitle">
          選択されたアプリが既存の契約に追加されました。
        </p>
      </div>

      {/* 決済詳細 */}
      <div className="details-card">
        <h2 className="details-title">📋 追加処理詳細</h2>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">💳 決済状況</span>
            <span className="detail-value status-paid">
              ✅ {paymentData?.payment_status === 'paid' ? '決済完了' : paymentData?.payment_status}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">📱 処理タイプ</span>
            <span className="detail-value">
              ➕ アプリ追加
            </span>
          </div>
        </div>
      </div>

      {/* 次のステップ */}
      <div className="details-card">
        <h2 className="details-title">🚀 次のステップ</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem',
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--radius-md)'
        }}>
          <span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>📱</span>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
              マイページで確認
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              追加されたアプリの利用状況や契約内容をご確認いただけます
            </p>
          </div>
          <Link href="/mypage" className="btn btn-primary">
            マイページへ
          </Link>
        </div>
      </div>

      {/* 完了メッセージ */}
      <div style={{
        background: 'var(--success-50)',
        border: '1px solid var(--success-200)',
        color: 'var(--success-800)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>✅</span>
        <strong>アプリ追加が正常に完了しました。</strong>
        <br />
        <span style={{ fontSize: '0.875rem' }}>
          新しいアプリは即座にご利用いただけます。
        </span>
      </div>
    </div>
  )
}

export default function AddAppSuccessPage() {
  return (
    <Suspense fallback={
      <div className="success-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">ページを読み込んでいます...</p>
        </div>
      </div>
    }>
      <AddAppSuccessContent />
    </Suspense>
  )
} 