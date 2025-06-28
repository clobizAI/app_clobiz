'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { useEffect, useState } from 'react'

export function Navigation() {
  const { user, logout, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  // クライアントサイドでのマウント完了を待つ
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      alert('ログアウトに失敗しました')
    }
  }

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <Link href="/" className="nav-link">
        🏠 ホーム
      </Link>
      
      {/* マウント完了 & ローディング完了まで認証UIを表示しない */}
      {mounted && !loading && (
        <>
          {user ? (
            <>
              <Link href="/mypage" className="nav-link">
                📊 マイページ
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--gray-600)',
                  background: 'var(--gray-100)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  👤 {user.displayName || user.email}
                </span>
                <button 
                  onClick={handleLogout}
                  className="nav-link"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: 'var(--red-600)',
                    fontSize: '0.875rem'
                  }}
                >
                  🚪 ログアウト
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">
                🔐 ログイン
              </Link>
              <Link 
                href="/signup" 
                className="nav-link"
                style={{
                  background: 'var(--primary-600)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none'
                }}
              >
                ✨ 新規登録
              </Link>
            </>
          )}
        </>
      )}
    </nav>
  )
} 