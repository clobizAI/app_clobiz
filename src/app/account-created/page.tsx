'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { businessApps, openaiProxyService } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'

function AccountCreatedContent() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const planId = searchParams.get('plan')
  const hasOpenAIProxy = searchParams.get('hasOpenAIProxy') === 'true'
  const selectedAppsParam = searchParams.get('selectedApps')
  const amount = searchParams.get('amount')
  
  const selectedApps = useMemo(() => {
    return selectedAppsParam ? selectedAppsParam.split(',').filter(app => app) : []
  }, [selectedAppsParam])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!email) {
    return (
      <div className="page-container fade-in">
        <div className="form-container" style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--error-600)', marginBottom: '0.5rem' }}>
              ❌ エラー
            </h1>
            <p style={{ color: 'var(--gray-600)' }}>
              アカウント情報が見つかりません
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/login" className="btn btn-primary">
              🔐 ログインページへ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container fade-in">
      <div className="form-container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        {/* アカウント作成完了ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '5rem', 
            height: '5rem', 
            background: 'var(--success-500)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <span style={{ fontSize: '2.5rem', color: 'white' }}>🎉</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            アカウント作成完了！
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '1.125rem' }}>
            {name}様、AI業務アプリサービスへようこそ！
          </p>
        </div>

        {/* アカウント情報確認 */}
        <div style={{
          background: 'var(--success-50)',
          border: '1px solid var(--success-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--success-800)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ✅ アカウント情報
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--success-700)' }}>👤 お名前</span>
              <span style={{ fontWeight: '600', color: 'var(--success-800)' }}>{name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--success-700)' }}>📧 メールアドレス</span>
              <span style={{ fontWeight: '600', color: 'var(--success-800)' }}>{email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--success-700)' }}>📦 プラン</span>
              <span style={{ fontWeight: '600', color: 'var(--success-800)' }}>🎯 基本プラン</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--success-700)' }}>💰 月額料金</span>
              <span style={{ fontWeight: '600', color: 'var(--success-800)' }}>
                HK${amount ? parseInt(amount).toLocaleString() : '800'}
              </span>
            </div>
          </div>
        </div>

        {/* 選択されたアプリ一覧 */}
        {selectedApps.length > 0 && (
          <div style={{
            background: 'var(--primary-50)',
            border: '1px solid var(--primary-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--primary-800)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🎯 利用可能なアプリ ({selectedApps.length}個)
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {selectedApps.map((appId) => {
                const app = businessApps.find(a => a.id === appId)
                return app ? (
                  <div key={appId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'white',
                    border: '1px solid var(--primary-300)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                        {app.name}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                        {app.description}
                      </p>
                    </div>
                    <span style={{ 
                      background: 'var(--success-100)', 
                      color: 'var(--success-800)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600' 
                    }}>
                      ✅ 利用可能
                    </span>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* 次のステップ */}
        <div style={{
          background: 'var(--blue-50)',
          border: '1px solid var(--blue-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--blue-800)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💡 次のステップ
          </h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            display: 'grid',
            gap: '0.75rem'
          }}>
            <li style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.75rem',
              color: 'var(--blue-700)'
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>📄</span>
              <span style={{ fontSize: '0.875rem' }}>契約書の準備を開始いたします（1-2営業日）</span>
            </li>
            <li style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.75rem',
              color: 'var(--blue-700)'
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>📬</span>
              <span style={{ fontSize: '0.875rem' }}>サービス利用開始のご案内をメールでお送りします</span>
            </li>
            <li style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.75rem',
              color: 'var(--blue-700)'
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔑</span>
              <span style={{ fontSize: '0.875rem' }}>専用サーバー（Dify）のアクセスURLをご提供します</span>
            </li>
            <li style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.75rem',
              color: 'var(--blue-700)'
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>📊</span>
              <span style={{ fontSize: '0.875rem' }}>マイページで契約状況・決済履歴・契約書をご確認いただけます</span>
            </li>
            <li style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.75rem',
              color: 'var(--blue-700)'
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>🎯</span>
              <span style={{ fontSize: '0.875rem' }}>専任サポートチームがセットアップをお手伝いします</span>
            </li>
          </ul>
        </div>

        {/* マイページへのボタン */}
        <div style={{ textAlign: 'center' }}>
          {mounted && !authLoading && user ? (
            <Link href="/mypage" className="btn btn-primary" style={{ 
              fontSize: '1.125rem', 
              padding: '1rem 2rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
                               📊 マイページへ
            </Link>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                ログイン状態を確認中...
              </p>
              <Link href="/mypage" className="btn btn-primary" style={{ 
                fontSize: '1.125rem', 
                padding: '1rem 2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📊 マイページへ
              </Link>
            </div>
          )}
        </div>

        {/* サポート情報 */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-lg)',
          fontSize: '0.875rem',
          color: 'var(--gray-600)'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            🎉 <strong>アカウント作成とお申し込みが完了しました！</strong>
          </p>
          <p>
            ご不明な点がございましたら、サポートチームまでお気軽にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AccountCreatedPage() {
  return (
    <Suspense fallback={
      <div className="page-container">
        <div className="form-container" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
          <p style={{ color: 'var(--gray-600)' }}>ページを読み込んでいます...</p>
        </div>
      </div>
    }>
      <AccountCreatedContent />
    </Suspense>
  )
} 