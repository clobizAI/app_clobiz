'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { storagePlans } from '@/lib/stripe'
import { useAuth } from '@/components/AuthProvider'
import { getUserContractsByEmail } from '@/lib/firestore'
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

      const response = await fetch('/api/storage-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: activeContract.id,
          newStoragePlan: selectedStoragePlan,
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
        <div className="header-section">
          <h1 className="header-title">💾 容量変更申請</h1>
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
      <div className="header-section">
        <h1 className="header-title">💾 容量変更申請</h1>
        <p className="header-description">
          データストレージの容量を変更できます。申請は前月末まで、翌月1日から適用されます。
        </p>
      </div>

      <div className="form-container">
        {/* 現在の容量プラン */}
        <div className="section-card">
          <h2 className="section-title">📊 現在の容量プラン</h2>
          <div className="current-plan">
            <div className="plan-info">
              <h3 className="plan-name">{currentPlan?.name}</h3>
              <p className="plan-price">
                {currentPlan?.price === 0 ? '基本プランに含まれる' : `HK$${currentPlan?.price}/月`}
              </p>
              <p className="plan-storage">{currentPlan?.storageGB}GB</p>
            </div>
          </div>
          
          {/* 申請中の容量プラン */}
          {pendingPlan && (
            <div className="pending-plan">
              <div className="alert alert-info">
                <strong>申請中:</strong> {pendingPlan.name} (HK${pendingPlan.price}/月) - 翌月1日から適用予定
              </div>
            </div>
          )}
        </div>

        {/* 重要なお知らせ */}
        <div className="notice-card">
          <h3 className="notice-title">⚠️ 重要なお知らせ</h3>
          <ul className="notice-list">
            <li><strong>申請締切:</strong> 前月末まで</li>
            <li><strong>適用日:</strong> 翌月1日から新容量でサービス開始</li>
            <li><strong>課金:</strong> 翌月1日の定期課金で新料金（即時課金なし）</li>
            <li><strong>支払い方法:</strong> 既存の支払い方法を使用（カード情報入力不要）</li>
          </ul>
        </div>

        {/* 申請が可能な場合のみ表示 */}
        {!pendingPlan && (
          <form onSubmit={handleSubmit}>
            <div className="section-card">
              <h2 className="section-title">📈 新しい容量プラン</h2>
              <div className="plans-grid">
                {availablePlans.map(plan => (
                  <div key={plan.id} className="plan-card">
                    <input
                      type="radio"
                      id={plan.id}
                      name="storagePlan"
                      value={plan.id}
                      checked={selectedStoragePlan === plan.id}
                      onChange={(e) => setSelectedStoragePlan(e.target.value)}
                      className="plan-radio"
                    />
                    <label htmlFor={plan.id} className="plan-label">
                      <div className="plan-header">
                        <h3 className="plan-name">{plan.name}</h3>
                        <p className="plan-price">HK${plan.price}/月</p>
                      </div>
                      <div className="plan-details">
                        <p className="plan-storage">{plan.storageGB}GB</p>
                        <p className="plan-upgrade">
                          現在より {plan.storageGB - (currentPlan?.storageGB || 5)}GB 増量
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {message && (
              <div className={`alert ${message.includes('完了') ? 'alert-success' : 'alert-error'}`}>
                {message}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                disabled={isSubmitting || !selectedStoragePlan}
                className="btn btn-primary btn-large"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    申請中...
                  </>
                ) : (
                  <>
                    📝 容量変更を申請する
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 既に申請済みの場合 */}
        {pendingPlan && (
          <div className="section-card">
            <div className="alert alert-info">
              <h3>申請済み</h3>
              <p>既に容量変更申請が完了しています。翌月1日から新しい容量でご利用いただけます。</p>
            </div>
          </div>
        )}

        <div className="form-actions">
          <Link href="/mypage" className="btn btn-secondary">
            ← マイページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
} 