'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { businessApps, openaiProxyService } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'

function SuccessContent() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const isDemo = searchParams.get('demo') === 'true'
  const planId = searchParams.get('plan')
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const hasOpenAIProxy = searchParams.get('hasOpenAIProxy') === 'true'
  const selectedAppsParam = searchParams.get('selectedApps')
  
  const selectedApps = useMemo(() => {
    return selectedAppsParam ? selectedAppsParam.split(',') : []
  }, [selectedAppsParam])
  
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      // デモモードまたは実際のセッション情報を設定
      setTimeout(() => {
        const basePrice = 800
        const proxyPrice = hasOpenAIProxy ? openaiProxyService.price : 0
        const totalPrice = basePrice + proxyPrice

        setSessionData({
          id: sessionId,
          payment_status: 'paid',
          customer_email: email || 'customer@example.com',
          customer_name: name || 'お客様',
          plan_id: planId || 'basic',
          amount_total: totalPrice,
          has_openai_proxy: hasOpenAIProxy,
          selected_apps: selectedApps,
          is_demo: isDemo
        })
        setLoading(false)
      }, 1000)
    } else {
      setLoading(false)
    }
  }, [sessionId, isDemo, planId, email, name, hasOpenAIProxy, selectedApps])

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

  if (!sessionId) {
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
          <h1 className="success-title">セッションが見つかりません</h1>
          <p className="success-subtitle">
            決済セッションが無効か、期限切れです。
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/" className="btn btn-primary">
            🏠 ホームに戻る
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
          お申し込み完了！
        </h1>
        <p className="success-subtitle">
          {sessionData?.customer_name}様、AI業務アプリサービスへのお申し込みありがとうございます！
        </p>
      </div>

      <div className="details-card">
        <h2 className="details-title">📋 お申し込み詳細</h2>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">👤 お名前</span>
            <span className="detail-value">{sessionData?.customer_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">📧 メールアドレス</span>
            <span className="detail-value">{sessionData?.customer_email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">📦 選択プラン</span>
            <span className="detail-value">🎯 基本プラン（HK$800/月）</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">🔒 OpenAI API代行</span>
            <span className="detail-value">
              {sessionData?.has_openai_proxy ? (
                <span style={{ color: 'var(--success-600)' }}>✅ あり（+HK$200/月）</span>
              ) : (
                <span style={{ color: 'var(--gray-500)' }}>❌ なし</span>
              )}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">💳 決済状況</span>
            <span className="detail-value status-paid">
              ✅ {sessionData?.payment_status === 'paid' ? '決済完了' : sessionData?.payment_status}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">💰 合計金額</span>
            <span className="detail-value" style={{ color: 'var(--primary-600)', fontSize: '1.125rem', fontWeight: '700' }}>
              HK${sessionData?.amount_total?.toLocaleString()}/月
            </span>
          </div>
          {sessionData?.is_demo && (
            <div className="detail-item">
              <span className="detail-label">🔧 モード</span>
              <span className="detail-value" style={{ color: 'var(--warning-600)' }}>
                デモモード
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 選択されたアプリ一覧 */}
      {sessionData?.selected_apps && sessionData.selected_apps.length > 0 && (
        <div className="details-card">
          <h2 className="details-title">🎯 利用希望アプリ一覧</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {sessionData.selected_apps.map((appId: string) => {
              const app = businessApps.find(a => a.id === appId)
              return app ? (
                <div key={appId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                      {app.name}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      {app.description}
                    </p>
                  </div>
                  <span style={{ 
                    background: 'var(--success-100)', 
                    color: 'var(--success-800)', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem', 
                    fontWeight: '600' 
                  }}>
                    ✅ 選択済み
                  </span>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      <div className="info-card" style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div className="info-icon">
          <span style={{ fontSize: '1.5rem' }}>💡</span>
        </div>
        <div className="info-content">
          <h3 className="info-title">次のステップ</h3>
          <ul className="info-list">
            <li>📄 契約書の準備を開始いたします（1-2営業日）</li>
            <li>📬 サービス利用開始のご案内をメールでお送りします</li>
            <li>🔑 APIキーやアクセス情報をご提供します</li>
            <li>📊 マイページからすぐにアプリを利用できます</li>
            <li>🎯 専任サポートチームがセットアップをお手伝いします</li>
          </ul>
        </div>
      </div>

      {sessionData?.is_demo && (
        <div style={{ 
          background: 'var(--warning-50)', 
          border: '1px solid var(--warning-200)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          margin: '2rem 0',
          display: 'flex',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>⚠️</span>
          <div>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: 'var(--warning-800)', 
              marginBottom: '0.5rem' 
            }}>
              デモモードでの動作
            </h3>
            <p style={{ color: 'var(--warning-700)', fontSize: '0.95rem' }}>
              これはデモ環境での動作です。実際のStripe決済は行われていません。本格運用時には適切なAPIキーを設定してください。
            </p>
          </div>
        </div>
      )}

      <div className="actions-container">
        <Link href="/" className="btn btn-secondary">
          🏠 ホームに戻る
        </Link>
        {user ? (
          <Link href="/mypage" className="btn btn-primary">
            📊 マイページからアプリを利用する
          </Link>
        ) : (
          <Link href="/login" className="btn btn-primary">
            🔐 ログインしてアプリを利用する
          </Link>
        )}
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '3rem', 
        padding: '2rem', 
        background: user ? 'var(--success-50)' : 'var(--primary-50)', 
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${user ? 'var(--success-200)' : 'var(--primary-200)'}`
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          color: user ? 'var(--success-800)' : 'var(--primary-800)', 
          marginBottom: '1rem' 
        }}>
          {user ? '🎉 ご利用開始のお知らせ' : '🎉 アカウント作成完了！'}
        </h3>
        <p style={{ color: user ? 'var(--success-700)' : 'var(--primary-700)', marginBottom: '1.5rem' }}>
          {user ? (
            <>
              マイページからすぐにAI業務アプリをご利用いただけます！<br />
              選択されたアプリが既に利用可能な状態になっています。
            </>
          ) : (
            <>
              決済完了と同時にアカウントを自動作成いたしました！<br />
              <strong>「{sessionData?.customer_email}」</strong>でアカウント作成し、AIアプリをすぐにご利用いただけます。
            </>
          )}
        </p>
        {user ? (
          <Link href="/mypage" className="btn btn-primary">
            🚀 今すぐアプリを使い始める
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              href={`/setup-password?email=${encodeURIComponent(sessionData?.customer_email || '')}&name=${encodeURIComponent(sessionData?.customer_name || '')}`}
              className="btn btn-primary"
            >
              🔐 パスワードを設定してアプリを使い始める
            </Link>
            <Link href="/login" className="btn btn-secondary">
              既存アカウントでログイン
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="success-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">ページを読み込んでいます...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
} 