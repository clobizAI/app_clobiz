'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { updateUser, getUserByEmail, createUser } from '@/lib/firestore'
import { Suspense } from 'react'

function SetupPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const name = searchParams.get('name')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
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

    setIsLoading(true)
    setError('')

    try {
      // Firebase Authでアカウントを作成
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      
      // プロフィールを更新
      if (name) {
        await updateProfile(user, { displayName: name })
      }

              // Firestoreのユーザー情報を更新（パスワード設定完了フラグを削除）
        try {
          // メールアドレスで既存のFirestoreユーザーを検索
          const existingUser = await getUserByEmail(email)
          if (existingUser) {
            // 既存ユーザーレコードを更新
            await updateUser(existingUser.uid, {
              passwordSetupRequired: false
            })
          } else {
            // 新しいユーザーレコードを作成
            await createUser(user.uid, {
              email: email,
              name: name || '',
              passwordSetupRequired: false,
              createdAt: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error('Failed to update user flags:', error)
          // エラーが発生してもログインは継続
        }

      // マイページにリダイレクト
      router.push('/mypage')
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
      setIsLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="page-container fade-in">
        <div className="form-container" style={{ maxWidth: '400px', margin: '2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--error-600)', marginBottom: '0.5rem' }}>
              ❌ エラー
            </h1>
            <p style={{ color: 'var(--gray-600)' }}>
              メールアドレスが指定されていません
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/" className="btn btn-primary">
              🏠 ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container fade-in">
      <div className="form-container" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            🔐 パスワード設定
          </h1>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
            アカウント「<strong>{email}</strong>」のパスワードを設定してください
          </p>
          <div style={{
            background: 'var(--success-50)',
            border: '1px solid var(--success-200)',
            color: 'var(--success-800)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem'
          }}>
            ✅ 決済完了と同時にアカウントを作成いたしました
          </div>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          {error && (
            <div style={{
              background: 'var(--red-50)',
              border: '1px solid var(--red-200)',
              color: 'var(--red-800)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              ❌ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              📧 メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              className="form-input"
              disabled
              style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}
            />
          </div>

          {name && (
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                👤 お名前
              </label>
              <input
                type="text"
                id="name"
                value={name}
                className="form-input"
                disabled
                style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}
              />
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
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              🔒 パスワード確認
            </label>
            <input
              type="password"
              id="confirmPassword"
              required
              className="form-input"
              placeholder="パスワードを再入力"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {isLoading ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚪</span>
                パスワード設定中...
              </>
            ) : (
              '🚀 パスワードを設定してアプリを使い始める'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
            既にアカウントをお持ちの場合は{' '}
            <Link 
              href="/login" 
              style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: '600' }}
            >
              こちらからログイン
            </Link>
          </p>
        </div>
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

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">ページを読み込んでいます...</p>
        </div>
      </div>
    }>
      <SetupPasswordContent />
    </Suspense>
  )
} 