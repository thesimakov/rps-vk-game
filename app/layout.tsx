import type { Metadata, Viewport } from 'next'
import { Rubik } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _rubik = Rubik({ subsets: ['latin', 'cyrillic'], weight: ['400', '500', '600', '700', '800', '900'] })

export const metadata: Metadata = {
  title: 'RPS Arena - Камень Ножницы Бумага',
  description: 'PvP онлайн игра Камень-Ножницы-Бумага. Делай ставки и побеждай!',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1440',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
