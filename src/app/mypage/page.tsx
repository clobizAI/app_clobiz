'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Contract } from '@/types'
import { businessApps } from '@/lib/stripe'

export default function MyPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 実際の実装では、Firebase Authで認証済みユーザーの契約情報を取得
    // ここではダミーデータを使用
    setTimeout(() => {
      setUser({
        uid: 'demo-user-123',
        email: 'user@example.com',
        name: '山田太郎',
      })

      setContracts([
        {
          id: 'contract-1',
          userId: 'demo-user-123',
          planId: 'basic',
          planName: '基本プラン',
          status: 'active',
          startDate: '2025-06-01T00:00:00Z',
          stripeCustomerId: 'cus_example123',
          stripeSubscriptionId: 'sub_example123',
          contractPdfUrl: 'https://example.com/contracts/demo-user-123.pdf',
          hasOpenAIProxy: true,
          selectedApps: ['faq-chat-ai', 'document-analyzer', 'email-assistant'],
          createdAt: '2025-06-01T00:00:00Z',
          updatedAt: '2025-06-01T00:00:00Z',
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleAppOpen = (appId: string) => {
    const app = businessApps.find(a => a.id === appId)
    if (app) {
      window.open(app.difyUrl, '_blank')
    }
  }

  const handleAddAppRequest = () => {
    alert('アプリ追加申請機能は準備中です。サポートまでお問い合わせください。')
  }

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
          <div className="user-field">
            <span className="user-label">お名前</span>
            <span className="user-value">{user?.name || 'ユーザー'}</span>
          </div>
          <div className="user-field">
            <span className="user-label">メールアドレス</span>
            <span className="user-value">{user?.email}</span>
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
                  <div className="contract-field">
                    <span className="contract-label">Stripe顧客ID</span>
                    <span className="contract-value">{contract.stripeCustomerId}</span>
                  </div>
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
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                        {app.name}
                      </h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                        {app.description}
                      </p>
                      <span style={{
                        display: 'inline-block',
                        background: 'var(--success-100)',
                        color: 'var(--success-800)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        ✅ 利用可能
                      </span>
                    </div>
                    <button
                      onClick={() => handleAppOpen(appId)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.95rem' }}
                    >
                      🚀 開く
                    </button>
                  </div>
                ) : null
              })}
            </div>
            
            {/* アプリ追加申請ボタン */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '2rem', 
              padding: '1.5rem',
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                さらにアプリを追加しませんか？
              </h4>
              <p style={{ fontSize: '0.95rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                他の業務アプリもご利用いただけます
              </p>
              <button
                onClick={handleAddAppRequest}
                className="btn btn-secondary"
                style={{ fontSize: '0.95rem' }}
              >
                ➕ アプリを追加申請する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 利用可能アプリがない場合 */}
      {activeContract && (!activeContract.selectedApps || activeContract.selectedApps.length === 0) && (
        <div className="contracts-card">
          <div className="contracts-header">
            <h2 className="contracts-title">🎯 ご利用中のAIアプリ</h2>
          </div>
          <div className="empty-state">
            <div className="empty-icon">
              <span style={{ fontSize: '4rem' }}>🤖</span>
            </div>
            <h3 className="empty-title">利用中のアプリがありません</h3>
            <p className="empty-description">アプリを追加して、AI業務効率化を始めましょう。</p>
            <div>
              <button
                onClick={handleAddAppRequest}
                className="btn btn-primary"
              >
                ➕ アプリを追加申請する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="actions-container">
        <Link href="/" className="btn btn-secondary">
          🆕 新しいプランを申し込む
        </Link>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            // 実際の実装ではFirebase Authのサインアウト
            alert('ログアウト機能は実装中です')
          }}
        >
          🚪 ログアウト
        </button>
      </div>

      {/* サポート情報 */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '3rem', 
        padding: '2rem', 
        background: 'var(--gray-50)', 
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          color: 'var(--gray-900)', 
          marginBottom: '1rem' 
        }}>
          🙋‍♂️ ご不明な点はございませんか？
        </h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
          サポートチームが24時間体制でお客様をサポートいたします
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <a 
            href="mailto:support@clobiz.ai" 
            className="btn btn-secondary"
            style={{ fontSize: '0.95rem' }}
          >
            📧 メールサポート
          </a>
          <a 
            href="tel:0120-000-000" 
            className="btn btn-secondary"
            style={{ fontSize: '0.95rem' }}
          >
            📞 お電話でのお問い合わせ
          </a>
        </div>
      </div>
    </div>
  )
} 