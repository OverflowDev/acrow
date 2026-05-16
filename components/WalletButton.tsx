'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet, ChevronDown } from 'lucide-react'

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain

        return (
          <div>
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg px-4 py-2 transition-colors text-sm"
              >
                <Wallet size={16} />
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 font-semibold rounded-lg px-4 py-2 transition-colors text-sm"
              >
                Wrong Network
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={openChainModal}
                  className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors"
                >
                  {chain.hasIcon && chain.iconUrl && (
                    <img src={chain.iconUrl} alt={chain.name} className="w-4 h-4 rounded-full" />
                  )}
                  <span className="hidden sm:inline">{chain.name}</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>
                <button
                  onClick={openAccountModal}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="font-mono text-slate-200">
                    {account.displayName}
                  </span>
                  <span className="hidden sm:inline text-slate-500 text-xs font-mono">
                    {account.displayBalance}
                  </span>
                </button>
              </div>
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
