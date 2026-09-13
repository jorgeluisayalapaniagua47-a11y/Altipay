'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet } from 'lucide-react'

export function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
            className="flex items-center gap-2"
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/60 hover:text-primary"
                  >
                    <span className="grid size-5 place-items-center rounded-md bg-primary/10 text-primary">
                      <Wallet className="size-3.5" />
                    </span>
                    Conectar billetera
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="rounded-lg bg-destructive/20 border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/30"
                  >
                    Cambiar a Fuji o HashKey
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="hidden items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground sm:inline-flex"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 py-1.5 pl-2.5 pr-3 text-xs font-medium text-foreground hover:border-primary/60"
                  >
                    <span className="font-mono text-primary font-semibold">{account.displayName}</span>
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
