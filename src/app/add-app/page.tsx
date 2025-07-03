'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { businessApps } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'
import { getUserContractsByEmail } from '@/lib/firestore'
import { Contract } from '@/types'
import Link from 'next/link'

export default function AddAppPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [iframeErrors, setIframeErrors] = useState<{[key: string]: boolean}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // ユーザーの契約情報を取得
  const loadUserContracts = useCallback(async () => {
    if (!user || !user.email) return

    try {
      setLoading(true)
      const userContracts = await getUserContractsByEmail(user.email)
      setContracts(userContracts)
    } catch (error) {
      console.error('Error loading contracts:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // 認証チェック
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && !authLoading) {
      loadUserContracts()
    }
  }, [user, authLoading, router, loadUserContracts])

  // 既に契約済みのアプリIDを取得
  const activeContract = contracts.find(c => c.status === 'active')
  const contractedApps = activeContract?.selectedApps || []

  // 選択可能なアプリ（契約済みを除外）
  const availableApps = businessApps.filter(app => !contractedApps.includes(app.id))

  const handleAppSelection = (appId: string) => {
    setSelectedApps(prev => 
      prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    )
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
    const loadingElement = document.getElementById(`loading-${appId}`)
    if (loadingElement) {
      loadingElement.style.display = 'none'
    }
  }

  // iframeタイムアウト機能
  useEffect(() => {
    if (openAccordion) {
      const timer = setTimeout(() => {
        const loadingElement = document.getElementById(`loading-${openAccordion}`)
        if (loadingElement && loadingElement.style.display !== 'none') {
          handleIframeError(openAccordion)
        }
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [openAccordion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedApps.length === 0) {
      setMessage('追加するアプリを選択してください。')
      return
    }

    if (!activeContract || !user) {
      setMessage('契約情報またはユーザー情報が取得できません。')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      console.log('Creating add-app checkout session:', {
        contractId: activeContract.id,
        selectedApps: selectedApps
      })

      const response = await fetch('/api/checkout-add-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: activeContract.id,
          selectedApps: selectedApps,
          userEmail: user.email
        }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        setMessage(`エラーが発生しました: ${errorData.error}`)
        return
      }

      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.url) {
        console.log('Redirecting to:', data.url)
        window.location.href = data.url
      } else {
        setMessage('決済URLが取得できませんでした。')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setMessage('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 認証中
  if (authLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">認証状態を確認しています...</p>
        </div>
      </div>
    )
  }

  // 未認証
  if (!user) {
    return null
  }

  // 契約情報読み込み中
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">契約情報を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  // アクティブな契約がない場合
  if (!activeContract) {
    return (
      <div className="page-container fade-in">
        <div className="page-header">
          <h1 className="page-title">
            <span style={{ WebkitTextFillColor: 'initial', backgroundClip: 'initial' }}>➕</span> アプリ追加申請
          </h1>
        </div>
        
        <div className="form-container">
          <div className="empty-state">
            <div className="empty-icon">
              <span style={{ fontSize: '4rem' }}>📄</span>
            </div>
            <h3 className="empty-title">有効な契約がありません</h3>
            <p className="empty-description">
              アプリ追加申請を行うには、まず基本プランにご契約いただく必要があります。
            </p>
            <div>
              <Link href="/" className="btn btn-primary">
                🚀 サービスに申し込む
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 追加可能なアプリがない場合
  if (availableApps.length === 0) {
    return (
      <div className="page-container fade-in">
        <div className="page-header">
          <h1 className="page-title">
            <span style={{ WebkitTextFillColor: 'initial', backgroundClip: 'initial' }}>➕</span> アプリ追加申請
          </h1>
          <p className="page-subtitle">追加可能なアプリを選択して申請できます</p>
        </div>
        
        <div className="form-container">
          <div className="empty-state">
            <div className="empty-icon">
              <span style={{ fontSize: '4rem' }}>✅</span>
            </div>
            <h3 className="empty-title">全てのアプリをご契約済みです</h3>
            <p className="empty-description">
              現在提供中の全てのビジネスアプリをご利用いただいています。
            </p>
            <div>
              <Link href="/mypage" className="btn btn-primary">
                📊 マイページに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalPrice = selectedApps.length * 400

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ WebkitTextFillColor: 'initial', backgroundClip: 'initial' }}>➕</span> アプリ追加申請
        </h1>
        <p className="page-subtitle">追加したいビジネスアプリを選択してください</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="form">
          {/* 現在の契約状況 */}
          <div className="info-card">
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--gray-700)' }}>
              📋 現在のご契約状況
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span className="status-badge status-active">
                ✅ {activeContract.planName}
              </span>
              <span style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                契約中のアプリ: {contractedApps.length}個
              </span>
            </div>
            {contractedApps.length > 0 && (
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                契約済み: {contractedApps.map(appId => {
                  const app = businessApps.find(a => a.id === appId)
                  return app?.name
                }).filter(Boolean).join('、')}
              </div>
            )}
          </div>

          {/* アプリ選択 */}
          <div className="form-group">
            <label className="form-label">
              📦 追加したいアプリを選択してください（複数選択可）
            </label>
            <div style={{ marginTop: '1rem' }}>
              {availableApps.map((app) => (
                <div key={app.id} style={{ marginBottom: '1rem' }}>
                  {/* アプリ選択行 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    border: `2px solid ${selectedApps.includes(app.id) ? 'var(--primary-500)' : 'var(--gray-300)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: selectedApps.includes(app.id) ? 'var(--primary-50)' : 'white',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="checkbox"
                      id={`app-${app.id}`}
                      checked={selectedApps.includes(app.id)}
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
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>
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
                      padding: '1rem',
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '500px',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden'
                      }}>
                        {/* 読み込み中表示 */}
                        <div 
                          id={`loading-${app.id}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'white',
                            zIndex: 10
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                            <p style={{ color: 'var(--gray-600)' }}>アプリを読み込んでいます...</p>
                          </div>
                        </div>

                                                 {/* アプリ別表示 */}
                         {app.id === 'email-assistant' ? (
                           // email-assistantの場合は実際のアプリを表示
                           iframeErrors[app.id] ? (
                             <div style={{
                               position: 'absolute',
                               top: 0,
                               left: 0,
                               right: 0,
                               bottom: 0,
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               background: 'var(--red-50)',
                               zIndex: 20
                             }}>
                               <div style={{ textAlign: 'center', color: 'var(--red-700)' }}>
                                 <p>⚠️ アプリの読み込みに失敗しました</p>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     setIframeErrors(prev => ({ ...prev, [app.id]: false }))
                                     const loadingElement = document.getElementById(`loading-${app.id}`)
                                     if (loadingElement) {
                                       loadingElement.style.display = 'flex'
                                     }
                                   }}
                                   className="btn btn-secondary"
                                   style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}
                                 >
                                   🔄 再読み込み
                                 </button>
                               </div>
                             </div>
                           ) : (
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
                           )
                         ) : (
                           // 他のアプリは制限メッセージを表示
                           <div style={{
                             position: 'absolute',
                             top: 0,
                             left: 0,
                             right: 0,
                             bottom: 0,
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             background: 'var(--gray-50)',
                             zIndex: 20
                           }}>
                             <div style={{ textAlign: 'center', color: 'var(--gray-600)' }}>
                               <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
                               <p style={{ marginBottom: '0.5rem' }}>{app.name}のデモ画面</p>
                               <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                                 本契約時に実際のアプリをご利用いただけます
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
                           </div>
                         )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 料金表示 */}
          {selectedApps.length > 0 && (
            <div className="info-card">
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--gray-700)' }}>
                💰 追加料金
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--gray-600)' }}>
                  選択したアプリ {selectedApps.length}個 × HK$400/月
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-600)' }}>
                  +HK${totalPrice}/月
                </span>
              </div>
            </div>
          )}

          {/* メッセージ表示 */}
          {message && (
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: message.includes('エラー') ? 'var(--red-50)' : 'var(--success-50)',
              border: `1px solid ${message.includes('エラー') ? 'var(--red-200)' : 'var(--success-200)'}`,
              color: message.includes('エラー') ? 'var(--red-800)' : 'var(--success-800)',
              marginBottom: '1rem'
            }}>
              {message}
            </div>
          )}

          {/* 申請ボタン */}
          <div className="form-group" style={{ textAlign: 'center' }}>
            <button
              type="submit"
              disabled={selectedApps.length === 0 || isSubmitting}
              className="btn btn-primary submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner" style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}></span>
                  申請中...
                </>
              ) : (
                <>
                  ➕ {selectedApps.length}個のアプリを申請する
                </>
              )}
            </button>
          </div>
        </form>

        <div className="actions-container">
          <Link href="/mypage" className="btn btn-secondary">
            ← マイページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
} 