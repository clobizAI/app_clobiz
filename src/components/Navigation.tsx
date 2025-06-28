'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { useEffect, useState } from 'react'

export function Navigation() {
  const { user, logout, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // クライアントサイドでのマウント完了を待つ
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      setIsMenuOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
      alert('ログアウトに失敗しました')
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* デスクトップナビゲーション */}
      <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '150px'
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

      {/* モバイルハンバーガーメニューボタン */}
      <button 
        className="mobile-menu-button"
        onClick={toggleMenu}
        style={{
          display: 'none',
          flexDirection: 'column',
          gap: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem'
        }}
      >
        <span style={{
          width: '24px',
          height: '2px',
          backgroundColor: 'var(--gray-600)',
          transition: 'all 0.3s ease',
          transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
        }}></span>
        <span style={{
          width: '24px',
          height: '2px',
          backgroundColor: 'var(--gray-600)',
          transition: 'all 0.3s ease',
          opacity: isMenuOpen ? 0 : 1
        }}></span>
        <span style={{
          width: '24px',
          height: '2px',
          backgroundColor: 'var(--gray-600)',
          transition: 'all 0.3s ease',
          transform: isMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none'
        }}></span>
      </button>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <div 
          className="mobile-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderTop: 'none',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/" className="nav-link" onClick={closeMenu}>
              🏠 ホーム
            </Link>
            
            {mounted && !loading && (
              <>
                {user ? (
                  <>
                    <Link href="/mypage" className="nav-link" onClick={closeMenu}>
                      📊 マイページ
                    </Link>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--gray-600)',
                      background: 'var(--gray-100)',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.5rem'
                    }}>
                      👤 {user.displayName || user.email}
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="nav-link"
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: 'var(--red-600)',
                        fontSize: '0.875rem',
                        textAlign: 'left',
                        padding: '0.5rem 1rem'
                      }}
                    >
                      🚪 ログアウト
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="nav-link" onClick={closeMenu}>
                      🔐 ログイン
                    </Link>
                    <Link 
                      href="/signup" 
                      className="nav-link"
                      onClick={closeMenu}
                      style={{
                        background: 'var(--primary-600)',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        textAlign: 'center'
                      }}
                    >
                      ✨ 新規登録
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
} 