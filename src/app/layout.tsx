import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: '🚀 CloBiz AI - 次世代AIサービス',
  description: 'ビジネスの未来を変える革新的なAIソリューション。Next.js + Firebase + Stripe搭載',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div className="app-container">
          <header className="header">
            <div className="header-content">
              <div className="logo">
                <h1>🤖 CloBiz AI</h1>
              </div>
              <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/" className="nav-link">
                  🏠 ホーム
                </Link>
                <Link href="/mypage" className="nav-link">
                  📊 マイページ
                </Link>
              </nav>
            </div>
          </header>
          <main className="main">{children}</main>
          <footer style={{
            background: 'var(--gray-800)',
            color: 'var(--gray-200)',
            padding: '2rem 0',
            textAlign: 'center',
            marginTop: 'auto'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
              <p style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                🤖 CloBiz AI - 次世代AIソリューション
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '2rem', 
                flexWrap: 'wrap',
                marginBottom: '1rem'
              }}>
                <a 
                  href="mailto:support@clobiz.ai" 
                  style={{ color: 'var(--gray-300)', textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  📧 support@clobiz.ai
                </a>
                <a 
                  href="tel:0120-000-000" 
                  style={{ color: 'var(--gray-300)', textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  📞 0120-000-000
                </a>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', margin: 0 }}>
                © 2025 CloBiz AI. All rights reserved. | 🔒 SSL暗号化通信対応
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
} 