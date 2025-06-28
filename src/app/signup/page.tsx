'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const { signUp, user } = useAuth()
  const router = useRouter()

  // クライアントサイドでのマウント完了を待つ
  useEffect(() => {
    setMounted(true)
  }, [])

  // 既にログインしている場合はマイページにリダイレクト
  useEffect(() => {
    if (mounted && user) {
      router.push('/mypage')
    }
  }, [mounted, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // パスワード確認チェック
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setIsLoading(false)
      return
    }

    // パスワードの長さチェック
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setIsLoading(false)
      return
    }

    try {
      await signUp(email, password, name)
      router.push('/mypage')
    } catch (error: any) {
      console.error('Sign up error:', error)
      
      // Firebase エラーメッセージの翻訳
      let errorMessage = 'アカウント作成に失敗しました'
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています'
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

  if (mounted && user) {
    return null // リダイレクト中
  }

  return (
    <div className="page-container fade-in">
      <div className="form-container" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            ✨ 新規登録
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            CloBiz AIアカウントを作成
          </p>
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
            <label htmlFor="name" className="form-label">
              👤 お名前
            </label>
            <input
              type="text"
              id="name"
              required
              className="form-input"
              placeholder="山田太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

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
                アカウント作成中...
              </>
            ) : (
              '✨ アカウント作成'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
            既にアカウントをお持ちの方は{' '}
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