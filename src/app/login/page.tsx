'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const { signIn, user } = useAuth()
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

    try {
      await signIn(email, password)
      router.push('/mypage')
    } catch (error) {
      console.error('Login error:', error)
      setError('メールアドレスまたはパスワードが正しくありません')
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
            🔐 ログイン
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            アカウントにログインしてください
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
              className="form-input"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                ログイン中...
              </>
            ) : (
              '🔐 ログイン'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
            アカウントをお持ちでない方は{' '}
            <Link 
              href="/signup" 
              style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: '600' }}
            >
              こちらから新規登録
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