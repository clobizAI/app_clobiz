'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { businessApps, openaiProxyService } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { updateUser, getUserByEmail, createUser } from '@/lib/firestore'

function SuccessContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const isDemo = searchParams.get('demo') === 'true'
  const planId = searchParams.get('plan')
  const applicantType = searchParams.get('applicantType') || 'corporate'
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const companyName = searchParams.get('companyName')
  const hasOpenAIProxy = searchParams.get('hasOpenAIProxy') === 'true'
  const selectedAppsParam = searchParams.get('selectedApps')
  
  const selectedApps = useMemo(() => {
    return selectedAppsParam ? selectedAppsParam.split(',') : []
  }, [selectedAppsParam])
  
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordSetting, setIsPasswordSetting] = useState(false)
  const [error, setError] = useState('')

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
          applicant_type: applicantType,
          customer_email: email || 'customer@example.com',
          customer_name: name || 'お客様',
          company_name: companyName || '',
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
  }, [sessionId, isDemo, planId, applicantType, email, name, companyName, hasOpenAIProxy, selectedApps])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sessionData?.customer_email) {
      setError('メールアドレスが指定されていません')
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }

    setIsPasswordSetting(true)
    setError('')

    try {
      // Firebase Authでアカウントを作成
      const { user } = await createUserWithEmailAndPassword(auth, sessionData.customer_email, password)
      
      // プロフィールを更新
      if (sessionData.customer_name) {
        await updateProfile(user, { displayName: sessionData.customer_name })
      }

      // Firestoreのユーザー情報を更新（パスワード設定完了フラグを削除）
      try {
        // メールアドレスで既存のFirestoreユーザーを検索
        const existingUser = await getUserByEmail(sessionData.customer_email)
        if (existingUser) {
          // 既存ユーザーレコードを更新
          await updateUser(existingUser.uid, {
            passwordSetupRequired: false
          })
        } else {
          // 新しいユーザーレコードを作成
          await createUser(user.uid, {
            email: sessionData.customer_email,
            name: sessionData.customer_name || '',
            passwordSetupRequired: false,
            createdAt: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error('Failed to update user flags:', error)
        // エラーが発生してもログインは継続
      }

      // アカウント作成完了画面にリダイレクト
      const params = new URLSearchParams({
        email: sessionData.customer_email,
        name: sessionData.customer_name || '',
        plan: sessionData.plan_id || 'basic',
        hasOpenAIProxy: sessionData.has_openai_proxy ? 'true' : 'false',
        selectedApps: selectedApps.join(','),
        amount: sessionData.amount_total.toString()
      })
      router.push(`/account-created?${params.toString()}`)
    } catch (error: any) {
      console.error('Password setup error:', error)
      
      let errorMessage = 'パスワード設定に失敗しました'
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています。ログインページからサインインしてください。'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'メールアドレスの形式が正しくありません'
      }
      
      setError(errorMessage)
    } finally {
      setIsPasswordSetting(false)
    }
  }

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
          <Link href="/login" className="btn btn-primary">
            🔐 ログインページへ
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
          決済完了！
        </h1>
        <p className="success-subtitle">
          {sessionData?.customer_name}様、AI業務アプリサービスへのお申し込みありがとうございます！
        </p>
      </div>

      <div className="details-card">
        <h2 className="details-title">📋 お申し込み詳細</h2>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">🏢 申込者区分</span>
            <span className="detail-value">
              {sessionData?.applicant_type === 'corporate' ? '🏢 法人・団体' : '👤 個人'}
            </span>
          </div>
          {sessionData?.applicant_type === 'corporate' && sessionData?.company_name && (
            <div className="detail-item">
              <span className="detail-label">🏢 法人名・会社名</span>
              <span className="detail-value">{sessionData.company_name}</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">
              {sessionData?.applicant_type === 'corporate' ? '👤 ご担当者名' : '👤 お名前'}
            </span>
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

      {/* パスワード設定フォーム */}
      <div className="details-card">
        <h2 className="details-title">🔐 パスワード設定</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
          アカウント「<strong>{sessionData?.customer_email}</strong>」のパスワードを設定してください
        </p>
        
        <div style={{
          background: 'var(--success-50)',
          border: '1px solid var(--success-200)',
          color: 'var(--success-800)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          ✅ 決済完了と同時にアカウントを作成いたしました
        </div>

        <form onSubmit={handlePasswordSubmit} className="application-form">
          {error && (
            <div style={{
              background: 'var(--red-50)',
              border: '1px solid var(--red-200)',
              color: 'var(--red-800)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              ❌ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              🔒 パスワード
            </label>
            <input
              type="password"
              id="password"
              required
              minLength={6}
              className="form-input"
              placeholder="6文字以上で入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPasswordSetting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              🔒 パスワード（確認）
            </label>
            <input
              type="password"
              id="confirmPassword"
              required
              minLength={6}
              className="form-input"
              placeholder="同じパスワードを再入力"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPasswordSetting}
            />
          </div>

          <button
            type="submit"
            disabled={isPasswordSetting}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '1rem', padding: '1rem' }}
          >
            {isPasswordSetting ? (
              <>
                <div className="loading-spinner" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}></div>
                設定中...
              </>
            ) : (
              <>
                🚀 パスワードを設定してアカウント作成を完了する
              </>
            )}
          </button>
        </form>
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