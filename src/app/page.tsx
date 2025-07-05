'use client'

import { useState, useEffect } from 'react'
import { plans, businessApps, openaiProxyService } from '@/lib/stripe'
import { ApplicationForm, Contract } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

export default function Home() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<ApplicationForm>({
    applicantType: 'corporate', // デフォルトは法人（メイン顧客のため）
    name: '',
    companyName: '',
    email: '',
    planId: 'basic', // 基本プラン800ドル
    hasOpenAIProxy: false,
    selectedApps: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [iframeErrors, setIframeErrors] = useState<{[key: string]: boolean}>({})
  const [emailValidation, setEmailValidation] = useState<{
    isChecking: boolean
    exists: boolean | null
    message: string
    error: string
  }>({
    isChecking: false,
    exists: null,
    message: '',
    error: ''
  })

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

  // メールアドレスバリデーション機能
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailValidation({
        isChecking: false,
        exists: null,
        message: '',
        error: ''
      })
      return
    }

    setEmailValidation(prev => ({ ...prev, isChecking: true, error: '' }))

    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'チェックに失敗しました')
      }

      setEmailValidation({
        isChecking: false,
        exists: data.exists,
        message: data.message,
        error: ''
      })
    } catch (error) {
      console.error('Email check error:', error)
      setEmailValidation({
        isChecking: false,
        exists: null,
        message: '',
        error: error instanceof Error ? error.message : 'エラーが発生しました'
      })
    }
  }

  // メールアドレス入力のデバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && !user) { // 未ログインユーザーのみチェック
        checkEmailExists(formData.email)
      }
    }, 1000) // 1秒後にチェック

    return () => clearTimeout(timer)
  }, [formData.email, user])

  // 料金計算：基本800 + アプリ×400 + API代行200
  const selectedPlan = plans.find(plan => plan.id === formData.planId) || plans[0]
  const selectedAppsPrice = formData.selectedApps.length * 400 // 各アプリ400ドル
  const totalPrice = selectedPlan.price + selectedAppsPrice + (formData.hasOpenAIProxy ? openaiProxyService.price : 0)

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

  const handleIframeError = (appId: string) => {
    console.error(`iframe load error for app: ${appId}`)
    setIframeErrors(prev => ({ ...prev, [appId]: true }))
  }

  const handleIframeLoad = (appId: string) => {
    console.log(`iframe loaded successfully for ${appId}`)
    // 読み込み中表示を隠す
    const loadingElement = document.getElementById(`loading-${appId}`)
    if (loadingElement) {
      loadingElement.style.display = 'none'
    }
  }

  // タイムアウト機能: 10秒後にエラー状態にする
  useEffect(() => {
    if (openAccordion) {
      const timer = setTimeout(() => {
        const loadingElement = document.getElementById(`loading-${openAccordion}`)
        if (loadingElement && loadingElement.style.display !== 'none') {
          handleIframeError(openAccordion)
        }
      }, 10000) // 10秒

      return () => clearTimeout(timer)
    }
  }, [openAccordion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Submitting form:', formData)

      // URLパラメータを構築
      const params = new URLSearchParams({
        applicantType: formData.applicantType,
        name: formData.name,
        companyName: formData.companyName || '',
        email: formData.email,
        planId: formData.planId,
        hasOpenAIProxy: formData.hasOpenAIProxy.toString(),
        selectedApps: formData.selectedApps.join(',')
      })

      // setup-passwordページにリダイレクト
      window.location.href = `/setup-password?${params.toString()}`
    } catch (error) {
      console.error('Form submission error:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  // ログイン済みユーザーへの表示
  if (mounted && user) {
    return (
      <div className="page-container fade-in">
        <div className="page-header">
          <h1 className="page-title">
            🎉 ご利用ありがとうございます！
          </h1>
          <p className="page-subtitle">
            既にアカウントをお持ちです。マイページでサービスをご利用ください
          </p>
        </div>

        {/* ログイン済みユーザー向けの案内 */}
        <div style={{ maxWidth: '600px', margin: '0 auto 3rem' }}>
          <div className="plan-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>👤</span>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: 'var(--gray-900)', 
                marginBottom: '0.5rem' 
              }}>
                {user.displayName || user.email} さん
              </h2>
              <p style={{ color: 'var(--gray-600)', fontSize: '1rem', marginBottom: '2rem' }}>
                既にログインされています
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <Link href="/mypage" className="btn btn-primary" style={{ minWidth: '200px' }}>
                📊 マイページで契約状況を確認
              </Link>
              
              <div style={{ 
                padding: '1.5rem', 
                background: 'var(--primary-50)', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--primary-200)',
                width: '100%',
                maxWidth: '400px'
              }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: 'var(--primary-800)', 
                  marginBottom: '0.75rem',
                  textAlign: 'center'
                }}>
                  🎯 アプリ追加をご希望の場合
                </h3>
                <p style={{ 
                  color: 'var(--primary-700)', 
                  fontSize: '0.875rem', 
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  新しいAI業務アプリの追加は<br />マイページから申請できます
                </p>
                <Link 
                  href="/add-app" 
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.875rem' }}
                >
                  ➕ アプリ追加申請へ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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

      {/* 基本プラン表示 */}
      <div style={{ maxWidth: '700px', margin: '0 auto 3rem' }}>
        <div className="plan-card plan-card-selected">
          <div className="plan-content">
            <h3 className="plan-name">
              🎯 {selectedPlan.name}
            </h3>
            <div className="plan-price">
              {selectedPlan.currency}${selectedPlan.price.toLocaleString()}
              <span className="plan-period">/月（基本料金）</span>
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
                {selectedPlan.features.map((feature: string, index: number) => (
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
                {selectedPlan.benefits.map((benefit: string, index: number) => (
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

      {/* 料金体系の説明 */}      
      <div style={{ maxWidth: '700px', margin: '0 auto 3rem' }}>
        <div className="plan-card">
          <div className="plan-content" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '1rem' }}>
              💰 アプリ追加料金
            </h3>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-600)', marginBottom: '0.5rem' }}>
              +HK$400
              <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--gray-600)' }}>/月・アプリごと</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              下記から必要なアプリを選択してください
            </p>
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

          {/* 申込者区分選択 */}
          <div className="form-group">
            <label className="form-label">
              🏢 申込者区分
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="applicantType"
                  value="corporate"
                  checked={formData.applicantType === 'corporate'}
                  onChange={(e) => setFormData({ ...formData, applicantType: e.target.value as 'individual' | 'corporate' })}
                  style={{ width: '1.25rem', height: '1.25rem' }}
                />
                🏢 法人・団体
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="applicantType"
                  value="individual"
                  checked={formData.applicantType === 'individual'}
                  onChange={(e) => setFormData({ ...formData, applicantType: e.target.value as 'individual' | 'corporate' })}
                  style={{ width: '1.25rem', height: '1.25rem' }}
                />
                👤 個人
              </label>
            </div>
          </div>

          {/* 法人名（法人選択時のみ表示） */}
          {formData.applicantType === 'corporate' && (
            <div className="form-group">
              <label htmlFor="companyName" className="form-label">
                🏢 法人名・会社名・団体名
              </label>
              <input
                type="text"
                id="companyName"
                required
                className="form-input"
                placeholder="株式会社〇〇、〇〇協会など"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
          )}

          {/* 基本情報 */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              {formData.applicantType === 'individual' ? '👤 お名前' : '👤 ご担当者名'}
            </label>
            <input
              type="text"
              id="name"
              required
              className="form-input"
              placeholder={formData.applicantType === 'individual' ? '山田太郎' : '山田太郎（ご担当者様）'}
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
            
            {/* メールバリデーション結果表示 */}
            {formData.email && (
              <div style={{ marginTop: '0.5rem' }}>
                {emailValidation.isChecking && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--gray-600)',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚪</span>
                    メールアドレスを確認しています...
                  </div>
                )}
                
                {!emailValidation.isChecking && emailValidation.exists === false && (
                  <div style={{
                    background: 'var(--success-50)',
                    border: '1px solid var(--success-200)',
                    color: 'var(--success-800)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem'
                  }}>
                    ✅ {emailValidation.message}
                  </div>
                )}
                
                {!emailValidation.isChecking && emailValidation.exists === true && (
                  <div style={{
                    background: 'var(--red-50)',
                    border: '1px solid var(--red-200)',
                    color: 'var(--red-800)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem'
                  }}>
                    ❌ {emailValidation.message}
                    <div style={{ marginTop: '0.5rem' }}>
                      <a href="/login" style={{ color: 'var(--red-600)', textDecoration: 'underline' }}>
                        こちらからログインしてください
                      </a>
                    </div>
                  </div>
                )}
                
                {!emailValidation.isChecking && emailValidation.error && (
                  <div style={{
                    background: 'var(--red-50)',
                    border: '1px solid var(--red-200)',
                    color: 'var(--red-800)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem'
                  }}>
                    ⚠️ {emailValidation.error}
                  </div>
                )}
              </div>
            )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: 0 }}>
                          {app.name}
                        </h4>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '600', 
                          color: 'var(--primary-600)', 
                          background: 'var(--primary-50)', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.25rem' 
                        }}>
                          +HK$400/月
                        </span>
                      </div>
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
                      padding: '0.5rem',
                      background: 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      {/* Dify埋め込みUI（デモ用） */}
                      {app.id === 'email-assistant' ? (
                        <div style={{
                          height: 'calc(100vh - 200px)',
                          minHeight: '500px',
                          maxHeight: '700px',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-md)',
                          background: 'white',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          {iframeErrors[app.id] ? (
                            // エラー時のフォールバック表示
                            <div style={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                              gap: '1rem',
                              background: 'var(--gray-50)'
                            }}>
                              <div style={{ fontSize: '3rem' }}>⚠️</div>
                              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '0.5rem' }}>
                                デモの読み込みに失敗しました
                              </h4>
                              <p style={{ color: 'var(--gray-600)', textAlign: 'center', marginBottom: '1rem' }}>
                                ネットワークの問題、またはサイトのセキュリティ設定により<br />
                                埋め込み表示ができません
                              </p>
                              <a
                                href={app.difyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ fontSize: '0.875rem' }}
                              >
                                🔗 新しいタブで開く
                              </a>
                            </div>
                          ) : (
                            <>
                              <iframe
                                src={app.difyUrl}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  border: 'none'
                                }}
                                allow="microphone"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                                onLoad={() => handleIframeLoad(app.id)}
                                onError={() => handleIframeError(app.id)}
                                title={`${app.name} デモ`}
                                loading="lazy"
                              />
                              {/* 読み込み中表示 */}
                              <div 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'var(--gray-50)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexDirection: 'column',
                                  gap: '1rem',
                                  zIndex: 1,
                                  pointerEvents: 'none'
                                }}
                                id={`loading-${app.id}`}
                              >
                                <div className="loading-spinner"></div>
                                <p style={{ color: 'var(--gray-600)' }}>デモを読み込んでいます...</p>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
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
                            🔗 新しいタブで確認
                          </a>
                        </div>
                      )}
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
              {/* 基本プラン */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.5rem',
                padding: '0.5rem',
                background: 'var(--primary-50)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--primary-200)'
              }}>
                <span>🎯 {selectedPlan.name}</span>
                <span style={{ fontWeight: '600' }}>HK${selectedPlan.price}</span>
              </div>

              {/* 選択されたアプリ */}
              {formData.selectedApps.length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                    📦 追加アプリ ({formData.selectedApps.length}個):
                  </p>
                  {formData.selectedApps.map(appId => {
                    const app = businessApps.find(a => a.id === appId)
                    return app ? (
                      <div key={appId} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        <span>• {app.name}</span>
                        <span style={{ fontWeight: '600' }}>+HK$400</span>
                      </div>
                    ) : null
                  })}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '1rem', 
                  background: 'var(--gray-50)', 
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--gray-600)',
                  marginTop: '1rem'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📱</div>
                  <p style={{ fontSize: '0.875rem' }}>アプリを選択すると追加料金が表示されます</p>
                </div>
              )}
              
              {/* OpenAI API代行 */}
              {formData.hasOpenAIProxy && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: '1rem',
                  padding: '0.5rem',
                  background: 'var(--orange-50)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--orange-200)'
                }}>
                  <span>🔒 {openaiProxyService.name}</span>
                  <span style={{ fontWeight: '600' }}>+HK${openaiProxyService.price}</span>
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
            disabled={isLoading || emailValidation.exists === true}
            className="btn btn-primary submit-btn"
            style={emailValidation.exists === true ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}></div>
                処理中...
              </>
            ) : emailValidation.exists === true ? (
              <>
                ❌ このメールアドレスは既にご契約済みです
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
} 