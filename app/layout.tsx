import type { Metadata } from 'next'
import { Bebas_Neue, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const bebas = Bebas_Neue({
  weight:   '400',
  subsets:  ['latin'],
  variable: '--font-bebas',
  display:  'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600', '700'],
  variable: '--font-space',
  display:  'swap',
})

const jetbrains = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500', '700'],
  variable: '--font-jb',
  display:  'swap',
})

export const metadata: Metadata = {
  title:       'Scrow — Trustless P2P Escrow on Arc Network',
  description: 'Lock it. Ship it. Collect. Trustless P2P escrow powered by USDC on Arc — sub-second finality, no middlemen.',
  icons:       { icon: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${bebas.variable} ${spaceGrotesk.variable} ${jetbrains.variable} min-h-screen antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
