'use client'

import { useState, useEffect } from 'react'
import { plans, businessApps, openaiProxyService } from '@/lib/stripe'
import { ApplicationForm } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

export default function Home() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<ApplicationForm>({
    name: '',
    email: '',
    planId: 'basic', // 基本プラン固定
    hasOpenAIProxy: false,
    selectedApps: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)

  // クライアントサイドでのマウント完了を待つ
  useEffect(() => {
    setMounted(true)
  }, [])

  // ログインユーザーの場合、フォームの初期値を設定（便利機能）
  useEffect(() => {
    if (user && !formData.name && !formData.email) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || ''
      }))
    }
  }, [user, formData.name, formData.email])

  const selectedPlan = plans[0] // 基本プランのみ
  const totalPrice = selectedPlan.price + (formData.hasOpenAIProxy ? openaiProxyService.price : 0)

  const handleAppSelection = (appId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedApps: prev.selectedApps.includes(appId)
        ? prev.selectedApps.filter(id => id !== appId)
        : [...prev.selectedApps, appId]
    }))
  }

  const toggleAccordion = (appId: string) => {
    setOpenAccordion(openAccordion === appId ? null : appId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Submitting form:', formData)

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        alert(`エラーが発生しました: ${errorData.error}`)
        return
      }

      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.url) {
        console.log('Redirecting to:', data.url)
        window.location.href = data.url
      } else {
        alert('決済URLが取得できませんでした。')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">
          🚀 AI業務アプリサービス
        </h1>
        <p className="page-subtitle">
          あなたのビジネスを効率化する、厳選されたAI業務アプリをご利用いただけます
        </p>
      </div>

      {/* 基本プラン表示（固定） */}
      <div style={{ maxWidth: '700px', margin: '0 auto 3rem' }}>
        <div className="plan-card plan-card-selected">
          <div className="plan-content">
            <h3 className="plan-name">
              🎯 {selectedPlan.name}
            </h3>
            <div className="plan-price">
              {selectedPlan.currency}${selectedPlan.price.toLocaleString()}
              <span className="plan-period">/月</span>
            </div>
            
            {/* 特徴セクション */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: 'var(--gray-800)', 
                marginBottom: '0.75rem',
                textAlign: 'left'
              }}>
                ✨ 特徴
              </h4>
              <ul className="plan-features">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="plan-feature">
                    <span className="feature-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* メリットセクション */}
            <div>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: 'var(--gray-800)', 
                marginBottom: '0.75rem',
                textAlign: 'left'
              }}>
                🎁 ご利用制限・メリット
              </h4>
              <ul className="plan-features">
                {selectedPlan.benefits.map((benefit, index) => (
                  <li key={index} className="plan-feature">
                    <span className="feature-check">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 申込フォーム */}
      <div className="form-container">
        <form onSubmit={handleSubmit} className="application-form">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              📝 お申し込み情報入力
            </h2>
            <p style={{ color: 'var(--gray-600)' }}>
              必要事項をご入力ください
            </p>
          </div>



          {/* ログインユーザーへの案内 */}
          {mounted && user && (
            <div style={{
              background: 'var(--success-50)',
              border: '1px solid var(--success-200)',
              color: 'var(--success-800)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              👤 <strong>{user.displayName || user.email}</strong> としてログイン中
              {formData.name && formData.email && ' - フォームに情報を自動入力しました'}
            </div>
          )}

          {/* 基本情報 */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              👤 お名前
            </label>
            <input
              type="text"
              id="name"
              required
              className="form-input"
              placeholder="山田太郎"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              📧 メールアドレス
            </label>
            <input
              type="email"
              id="email"
              required
              className="form-input"
              placeholder="your@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* OpenAI API代行オプション */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.hasOpenAIProxy}
                onChange={(e) => setFormData({ ...formData, hasOpenAIProxy: e.target.checked })}
                style={{ width: '1.25rem', height: '1.25rem' }}
              />
              🔒 OpenAI APIをお持ちでない方はこちら（＋HK${openaiProxyService.price}/月）
            </label>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.5rem', marginLeft: '1.75rem' }}>
              {openaiProxyService.description}
            </p>
          </div>

          {/* 業務アプリ選択 */}
          <div className="form-group">
            <label className="form-label">
              📦 ご希望の業務アプリを選択してください（複数選択可）
            </label>
            <div style={{ marginTop: '1rem' }}>
              {businessApps.map((app) => (
                <div key={app.id} style={{ marginBottom: '1rem' }}>
                  {/* アプリ選択行 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    border: `2px solid ${formData.selectedApps.includes(app.id) ? 'var(--primary-500)' : 'var(--gray-300)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: formData.selectedApps.includes(app.id) ? 'var(--primary-50)' : 'white',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="checkbox"
                      id={`app-${app.id}`}
                      checked={formData.selectedApps.includes(app.id)}
                      onChange={() => handleAppSelection(app.id)}
                      style={{ width: '1.25rem', height: '1.25rem', marginRight: '1rem' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                        {app.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {app.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAccordion(app.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      ▶ 試す
                    </button>
                  </div>

                  {/* アコーディオン部分 */}
                  {openAccordion === app.id && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '1.5rem',
                      background: 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h5 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                          {app.name} - デモ
                        </h5>
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          実際のアプリをお試しいただけます
                        </p>
                      </div>
                      
                      {/* Dify埋め込みUI（デモ用） */}
                      <div style={{
                        height: '400px',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--gray-50)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}>
                        <div style={{ fontSize: '2rem' }}>🤖</div>
                        <p style={{ color: 'var(--gray-600)', textAlign: 'center' }}>
                          {app.name}のデモ画面<br />
                          <small>本契約後に実際のアプリをご利用いただけます</small>
                        </p>
                        <a
                          href={app.difyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{ fontSize: '0.875rem' }}
                        >
                          フルバージョンを確認
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 料金サマリー */}
          <div className="selected-plan">
            <h4 className="selected-plan-title">
              💰 お申し込み内容・料金
            </h4>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>🎯 {selectedPlan.name}</span>
                <span style={{ fontWeight: '600' }}>HK${selectedPlan.price}</span>
              </div>
              {formData.hasOpenAIProxy && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>🔒 {openaiProxyService.name}</span>
                  <span style={{ fontWeight: '600' }}>HK${openaiProxyService.price}</span>
                </div>
              )}
              {formData.selectedApps.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    📦 選択中のアプリ ({formData.selectedApps.length}個):
                  </p>
                  {formData.selectedApps.map(appId => {
                    const app = businessApps.find(a => a.id === appId)
                    return app ? (
                      <div key={appId} style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                        • {app.name}
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              paddingTop: '1rem', 
              borderTop: '2px solid var(--primary-200)',
              fontSize: '1.125rem',
              fontWeight: '700'
            }}>
              <span>合計（月額）</span>
              <span style={{ color: 'var(--primary-600)' }}>HK${totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary submit-btn"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}></div>
                処理中...
              </>
            ) : (
              <>
                🎉 今すぐ申し込む（HK${totalPrice.toLocaleString()}/月）
              </>
            )}
          </button>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: 'var(--gray-50)', 
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--gray-600)'
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              🔒 SSL暗号化通信により、お客様の情報を安全に保護しています
            </p>
            <p>
              ✨ 申し込み完了と同時にアカウントを自動作成し、すぐにAIアプリをご利用いただけます
            </p>
          </div>
        </form>
      </div>
    </div>
  )
} 