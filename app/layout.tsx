import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KEIO HANDBALL Work Load Checker',
  description: 'ハンドボールチーム向けコンディション・負荷管理アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
