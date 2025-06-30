import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthProvider } from '@/components/AuthProvider'
import { Navigation } from '@/components/Navigation'
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
        <AuthProvider>
          <div className="app-container">
            <header className="header">
              <div className="header-content">
                <div className="logo">
                  <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h1 style={{ cursor: 'pointer' }}>🤖 CloBiz AI</h1>
                  </Link>
                </div>
                <Navigation />
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
                  🤖 CloBiz - 次世代AIソリューション
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '2rem', 
                  flexWrap: 'wrap',
                  marginBottom: '1rem'
                }}>
                  <a 
                    href="mailto:info@clobiz.net" 
                    style={{ color: 'var(--gray-300)', textDecoration: 'none', fontSize: '0.95rem' }}
                  >
                    📧 info@clobiz.net
                  </a>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', margin: 0 }}>
                  © 2025 CloBiz. All rights reserved. | 🔒 SSL暗号化通信対応
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
} 