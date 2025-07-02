'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Contract } from '@/types'
import { businessApps } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'
import { getUserContractsByEmail } from '@/lib/firestore'

export default function MyPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const loadUserContracts = useCallback(async () => {
    if (!user || !user.email) return

    try {
      setLoading(true)
      const userContracts = await getUserContractsByEmail(user.email)
      
      // 実際の契約データのみを表示
      setContracts(userContracts)
    } catch (error) {
      console.error('Error loading contracts:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // 認証チェック: ログインしていない場合はログインページにリダイレクト
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    // ユーザーがログインしている場合のみ契約情報を取得
    if (user && !authLoading) {
      loadUserContracts()
    }
  }, [user, authLoading, router, loadUserContracts])

  // ページがフォーカスされたときに常に最新データを取得
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !authLoading) {
        loadUserContracts()
      }
    }

    const handleFocus = () => {
      if (user && !authLoading) {
        loadUserContracts()
      }
    }

    // ページがフォーカスされたときとvisibilityが変更されたときに再取得
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, authLoading, loadUserContracts])

  const handleAppOpen = (appId: string) => {
    const app = businessApps.find(a => a.id === appId)
    if (app) {
      window.open(app.difyUrl, '_blank')
    }
  }

  const handleAddAppRequest = () => {
    router.push('/add-app')
  }

  // 認証中の場合
  if (authLoading) {
    return (
      <div className="mypage-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">認証状態を確認しています...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合
  if (!user) {
    return null // リダイレクト中
  }

  // データ読み込み中
  if (loading) {
    return (
      <div className="mypage-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">契約情報を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  const activeContract = contracts.find(c => c.status === 'active')

  return (
    <div className="mypage-container fade-in">
      <div className="mypage-header">
        <h1 className="mypage-title">📊 マイページ</h1>
        <p className="mypage-subtitle">契約状況とAI業務アプリをご利用いただけます</p>
      </div>

      {/* ユーザー情報 */}
      <div className="user-card">
        <h2 className="user-card-title">👤 ユーザー情報</h2>
        <div className="user-grid">
          {activeContract?.companyName && (
            <div className="user-field">
              <span className="user-label">会社名</span>
              <span className="user-value">{activeContract.companyName}</span>
            </div>
          )}
          <div className="user-field">
            <span className="user-label">お名前</span>
            <span className="user-value">{user.displayName || 'ユーザー'}</span>
          </div>
          <div className="user-field">
            <span className="user-label">メールアドレス</span>
            <span className="user-value">{user.email}</span>
          </div>
          <div className="user-field">
            <span className="user-label">登録日</span>
            <span className="user-value">
              {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ja-JP') : '不明'}
            </span>
          </div>
        </div>
      </div>

      {/* 契約情報 */}
      <div className="contracts-card">
        <div className="contracts-header">
          <h2 className="contracts-title">📋 契約情報</h2>
        </div>
        
        {contracts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <span style={{ fontSize: '4rem' }}>📄</span>
            </div>
            <h3 className="empty-title">契約がありません</h3>
            <p className="empty-description">まだサービスにお申し込みいただいていません。</p>
            <div>
              <Link href="/" className="btn btn-primary">
                🚀 サービスに申し込む
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {contracts.map((contract) => (
              <div key={contract.id} className="contract-item">
                <div className="contract-header">
                  <div style={{ flex: 1 }}>
                    <h3 className="contract-title">
                      🎯 {contract.planName}（HK$800/月）
                    </h3>
                    <div className="contract-meta">
                      <span className={`status-badge ${
                        contract.status === 'active' 
                          ? 'status-active'
                          : contract.status === 'pending'
                          ? 'status-pending'
                          : 'status-inactive'
                      }`}>
                        {contract.status === 'active' && '✅ 有効'}
                        {contract.status === 'pending' && '⏳ 保留中'}
                        {contract.status === 'inactive' && '❌ 無効'}
                        {contract.status === 'cancelled' && '🚫 キャンセル済み'}
                      </span>
                      <span className="contract-date">
                        📅 開始日: {new Date(contract.startDate).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  <div className="contract-actions">
                    {contract.contractPdfUrl && (
                      <a
                        href={contract.contractPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.875rem' }}
                      >
                        📄 契約書PDF
                      </a>
                    )}
                  </div>
                </div>

                <div className="contract-details">
                  {contract.companyName && (
                    <div className="contract-field">
                      <span className="contract-label">会社名</span>
                      <span className="contract-value">{contract.companyName}</span>
                    </div>
                  )}
                  <div className="contract-field">
                    <span className="contract-label">OpenAI API代行の有無</span>
                    <span className="contract-value" style={{
                      background: contract.hasOpenAIProxy ? 'var(--success-100)' : 'var(--gray-100)',
                      color: contract.hasOpenAIProxy ? 'var(--success-800)' : 'var(--gray-600)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {contract.hasOpenAIProxy ? '✅ あり（+HK$200/月）' : '❌ なし'}
                    </span>
                  </div>
                  <div className="contract-field">
                    <span className="contract-label">契約ID</span>
                    <span className="contract-value">{contract.id}</span>
                  </div>
                  {contract.stripeCustomerId && (
                    <div className="contract-field">
                      <span className="contract-label">Stripe顧客ID</span>
                      <span className="contract-value">{contract.stripeCustomerId}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アプリ利用セクション */}
      {activeContract && activeContract.selectedApps && activeContract.selectedApps.length > 0 && (
        <div className="contracts-card">
          <div className="contracts-header">
            <h2 className="contracts-title">🎯 ご利用中のAIアプリ</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {activeContract.selectedApps.map((appId) => {
                const app = businessApps.find(a => a.id === appId)
                return app ? (
                  <div key={appId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1.5rem',
                    background: 'var(--primary-50)',
                    border: '1px solid var(--primary-200)',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '600', 
                        color: 'var(--gray-900)', 
                        marginBottom: '0.5rem' 
                      }}>
                        {app.name}
                      </h4>
                      <p style={{ 
                        color: 'var(--gray-600)', 
                        fontSize: '0.875rem',
                        marginBottom: '0.75rem' 
                      }}>
                        {app.description}
                      </p>
                      <span style={{
                        background: 'var(--primary-100)',
                        color: 'var(--primary-800)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {app.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAppOpen(appId)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.875rem' }}
                    >
                      🚀 アプリを開く
                    </button>
                  </div>
                ) : null
              })}
            </div>
            
            <div style={{ 
              textAlign: 'center', 
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--gray-300)'
            }}>
              <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
                他のAIアプリもご利用になりたい場合はお申し付けください
              </p>
              <button
                onClick={handleAddAppRequest}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem' }}
              >
                ➕ アプリ追加を申請
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 