'use client'

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider }                  from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig }                    from '@/lib/wagmi'
import { useEffect }                      from 'react'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

// Suppress unhandled promise rejections from browser wallet extensions
// (MetaMask, Backpack, etc.) that fire their own internal errors on init.
function useWalletExtensionErrorSuppressor() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message ?? ''
      if (
        msg.includes('MetaMask') ||
        msg.includes('wallet') ||
        msg.includes('ethereum') ||
        msg.includes('extension')
      ) {
        event.preventDefault()
      }
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])
}

const rkTheme = darkTheme({
  accentColor:            '#10B981',
  accentColorForeground:  'white',
  borderRadius:           'medium',
  overlayBlur:            'small',
  fontStack:              'system',
})

export function Providers({ children }: { children: React.ReactNode }) {
  useWalletExtensionErrorSuppressor()
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme} coolMode>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
