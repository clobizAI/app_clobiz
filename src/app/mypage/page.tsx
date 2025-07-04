'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Contract } from '@/types'
import { businessApps, storagePlans } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'

export default function MyPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // API経由で契約情報を取得
  const loadUserContracts = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const idToken = await user.getIdToken()
      const res = await fetch('/api/get-contracts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })
      if (!res.ok) throw new Error('契約情報の取得に失敗')
      const data = await res.json()
      setContracts(data.contracts || [])
    } catch (error) {
      console.error('Error loading contracts:', error)
      setContracts([])
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

  const handleStorageUpgradeRequest = () => {
    router.push('/storage-upgrade')
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


              </div>
            ))}
          </div>
        )}
      </div>

      {/* API代行セクション */}
      {activeContract && (
        <div className="contracts-card">
          <div className="contracts-header">
            <h2 className="contracts-title">🤖 API代行</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              {/* OpenAI */}
              <div style={{
                padding: '1rem',
                background: activeContract.hasOpenAIProxy ? 'var(--success-50)' : 'var(--gray-50)',
                border: `1px solid ${activeContract.hasOpenAIProxy ? 'var(--success-200)' : 'var(--gray-200)'}`,
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: 'var(--gray-900)', 
                  marginBottom: '0.5rem' 
                }}>
                  OpenAI<br/>
                  <span style={{ fontSize: '0.875rem', fontWeight: '400' }}>
                    {activeContract.hasOpenAIProxy ? '✅ 利用中' : '❌ 未利用'}
                  </span>
                </h4>
                <p style={{ 
                  color: 'var(--gray-600)', 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  HK$200/月
                </p>
              </div>

              {/* Anthropic */}
              <div style={{
                padding: '1rem',
                background: 'var(--gray-50)', // 仮で未利用状態
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: 'var(--gray-900)', 
                  marginBottom: '0.5rem' 
                }}>
                  Anthropic<br/>
                  <span style={{ fontSize: '0.875rem', fontWeight: '400' }}>
                    ❌ 未利用
                  </span>
                </h4>
                <p style={{ 
                  color: 'var(--gray-600)', 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  HK$200/月
                </p>
              </div>

              {/* Google */}
              <div style={{
                padding: '1rem',
                background: 'var(--gray-50)', // 仮で未利用状態
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: 'var(--gray-900)', 
                  marginBottom: '0.5rem' 
                }}>
                  Google<br/>
                  <span style={{ fontSize: '0.875rem', fontWeight: '400' }}>
                    ❌ 未利用
                  </span>
                </h4>
                <p style={{ 
                  color: 'var(--gray-600)', 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  HK$200/月
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 容量プランセクション */}
      {activeContract && (
        <div className="contracts-card">
          <div className="contracts-header">
            <h2 className="contracts-title">💾 データストレージ</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            {(() => {
              const currentStoragePlan = activeContract.currentStoragePlan || '5gb'
              const pendingStoragePlan = activeContract.pendingStoragePlan
              const currentPlan = storagePlans.find(plan => plan.id === currentStoragePlan)
              const pendingPlan = pendingStoragePlan ? storagePlans.find(plan => plan.id === pendingStoragePlan) : null

              return (
                <div>
                  {/* 現在の容量プラン */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'var(--success-50)',
                    border: '1px solid var(--success-200)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '600', 
                        color: 'var(--gray-900)', 
                        marginBottom: '0.75rem' 
                      }}>
                        📊 現在の容量プラン: {currentPlan?.name}
                      </h4>
                      <span style={{
                        background: currentPlan?.price === 0 ? 'var(--success-100)' : 'var(--blue-100)',
                        color: currentPlan?.price === 0 ? 'var(--success-800)' : 'var(--blue-800)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {currentPlan?.price === 0 ? '基本プランに含まれています' : `HK$${currentPlan?.price}/月`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {!pendingPlan ? (
                        <button
                          onClick={handleStorageUpgradeRequest}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.875rem' }}
                        >
                          💾 容量変更を申請
                        </button>
                      ) : (
                        <div style={{ 
                          padding: '0.5rem 1rem',
                          background: 'var(--warning-100)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'var(--warning-800)',
                          textAlign: 'center'
                        }}>
                          ⏳ 申請済み
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 申請中の容量プラン */}
                  {pendingPlan && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'var(--warning-50)',
                      border: '1px solid var(--warning-200)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '600', 
                          color: 'var(--gray-900)', 
                          marginBottom: '0.5rem' 
                        }}>
                          ⏳ 申請中の容量プラン: {pendingPlan.name}
                        </h4>
                        <p style={{ 
                          color: 'var(--gray-600)', 
                          fontSize: '0.875rem',
                          marginBottom: '0.75rem' 
                        }}>
                          翌月1日から適用予定
                        </p>
                        <span style={{
                          background: 'var(--warning-100)',
                          color: 'var(--warning-800)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          HK${pendingPlan.price}/月
                        </span>
                      </div>
                    </div>
                  )}


                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* アプリ利用セクション */}
      {activeContract && activeContract.selectedApps && activeContract.selectedApps.length > 0 && (
        <div className="contracts-card">
          <div className="contracts-header">
            <h2 className="contracts-title">🎯 ご利用中のAIアプリ</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {activeContract.selectedApps.map((appId) => {
                const app = businessApps.find(a => a.id === appId)
                return app ? (
                  <div key={appId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--primary-50)',
                    border: '1px solid var(--primary-200)',
                    borderRadius: 'var(--radius-md)',
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
              marginTop: '1rem',
              padding: '1rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)',
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