'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { storagePlans } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'
import { Contract } from '@/types'
import Link from 'next/link'

export default function StorageUpgradePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStoragePlan, setSelectedStoragePlan] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // ユーザーの契約情報を取得
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

  // アクティブな契約を取得
  const activeContract = contracts.find(c => c.status === 'active')
  const currentStoragePlan = activeContract?.currentStoragePlan || '5gb'
  const pendingStoragePlan = activeContract?.pendingStoragePlan

  // 現在の容量プランの詳細を取得
  const currentPlan = storagePlans.find(plan => plan.id === currentStoragePlan)
  const pendingPlan = pendingStoragePlan ? storagePlans.find(plan => plan.id === pendingStoragePlan) : null

  // 選択可能な容量プラン（現在のプランを除外）
  const availablePlans = storagePlans.filter(plan => plan.id !== currentStoragePlan)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStoragePlan) {
      setMessage('変更する容量プランを選択してください。')
      return
    }

    if (!activeContract || !user) {
      setMessage('契約情報またはユーザー情報が取得できません。')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      console.log('Creating storage upgrade request:', {
        contractId: activeContract.id,
        newStoragePlan: selectedStoragePlan
      })

      const idToken = await user.getIdToken()
      const response = await fetch('/api/storage-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          contractId: activeContract.id,
          newStoragePlan: selectedStoragePlan
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
      
      if (data.success) {
        setMessage('容量変更申請が完了しました。翌月1日から新しい容量でご利用いただけます。')
        setSelectedStoragePlan('')
        // 契約情報を再読み込み
        await loadUserContracts()
      } else {
        setMessage('申請に失敗しました。もう一度お試しください。')
      }
    } catch (error) {
      console.error('Storage upgrade error:', error)
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
            <span style={{ WebkitTextFillColor: 'initial', backgroundClip: 'initial' }}>📦</span> 容量変更申請
          </h1>
        </div>
        
        <div className="form-container">
          <div className="empty-state">
            <div className="empty-icon">
              <span style={{ fontSize: '4rem' }}>📄</span>
            </div>
            <h3 className="empty-title">有効な契約がありません</h3>
            <p className="empty-description">
              容量変更申請を行うには、まず基本プランにご契約いただく必要があります。
            </p>
            <Link href="/" className="btn btn-primary">
              🏠 ホームページへ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ WebkitTextFillColor: 'initial', backgroundClip: 'initial' }}>📦</span> 容量変更申請
        </h1>
        <p className="page-subtitle">
          データストレージをアップグレードできます。
        </p>
      </div>

      <div className="form-container">
        {/* 現在の容量プラン */}
        <div className="contracts-card">
          <div className="contracts-header">
            <h2 className="contracts-title">📦 データストレージ</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div className="plan-card plan-card-selected">
              <div className="plan-content">
                <h4 className="plan-name">
                  📊 現在のプラン: {currentPlan?.name}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: '0.5rem 0' }}>
                  {currentPlan?.price === 0 ? '基本プランに含まれています' : `HK$${currentPlan?.price}/月`}
                </p>
              </div>
            </div>
            
            {/* 申請中の容量プラン */}
            {pendingPlan && (
              <div className="plan-card" style={{ 
                background: 'var(--warning-50)', 
                borderColor: 'var(--warning-200)' 
              }}>
                <div className="plan-content">
                  <h4 className="plan-name">
                    ⏳ 申請中の容量プラン: {pendingPlan.name}
                  </h4>
                  <p className="plan-features">
                    翌月1日から適用予定 - {pendingPlan.storageGB}GB利用可能
                  </p>
                  <span className="plan-price" style={{
                    background: 'var(--warning-100)',
                    color: 'var(--warning-800)'
                  }}>
                    HK${pendingPlan.price}/月
                  </span>
                </div>
              </div>
            )}

            {/* 申請が可能な場合のみ表示 */}
            {!pendingPlan && (
              <div>
                {/* 重要なお知らせ */}
                <div className="notice-card" style={{ textAlign: 'center', margin: '2rem 0' }}>
                  <h3 className="notice-title">⚠️ 申請前に必ずご確認ください</h3>
                  <ul className="notice-list" style={{ textAlign: 'left', display: 'inline-block', margin: '0 auto' }}>
                    <li><strong>申請締切:</strong> 毎月末まで</li>
                    <li><strong>適用開始:</strong> 翌月1日から新しい容量でご利用可能</li>
                    <li><strong>課金タイミング:</strong> 翌月1日の定期課金から新料金</li>
                  </ul>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 className="contracts-title" style={{ marginBottom: '1rem' }}>📈 新しい容量プラン</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {availablePlans.map(plan => (
                        <div 
                          key={plan.id} 
                          className={`plan-card ${selectedStoragePlan === plan.id ? 'plan-card-selected' : ''}`}
                          onClick={() => setSelectedStoragePlan(plan.id)}
                          style={{ padding: '1rem' }}
                        >
                          <input
                            type="radio"
                            id={plan.id}
                            name="storagePlan"
                            value={plan.id}
                            checked={selectedStoragePlan === plan.id}
                            onChange={(e) => setSelectedStoragePlan(e.target.value)}
                            style={{ position: 'absolute', opacity: 0 }}
                          />
                          <div className="plan-content">
                            <h4 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-600)', margin: '0' }}>
                              📦 {plan.name}
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', margin: '0.25rem 0 0 0' }}>
                              HK${plan.price}/月
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {message && (
                    <div className={`alert ${message.includes('完了') ? 'alert-success' : 'alert-error'}`}>
                      {message}
                    </div>
                  )}

                  <div className="form-group" style={{ textAlign: 'center' }}>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !selectedStoragePlan}
                      className="btn btn-primary submit-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="loading-spinner" style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}></span>
                          申請中...
                        </>
                      ) : (
                        <>
                          📦 容量変更を申請
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 既に申請済みの場合 */}
            {pendingPlan && (
              <div className="info-card">
                <div className="info-content">
                  <p className="info-title">
                    容量変更申請が完了済みです。翌月1日から新しい容量でご利用いただけます。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="actions-container">
          <Link href="/mypage" className="btn btn-secondary">
            ← マイページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
} 