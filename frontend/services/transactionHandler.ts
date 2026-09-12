import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { DEPLOYED_CONTRACTS } from '@/contracts/deployedContracts'

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#66e3d0', '#77a7ff', '#ffffff', '#10b981'],
    })
  } catch (e) {
    // ignore if canvas not supported
  }
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const config = DEPLOYED_CONTRACTS[chainId]
  if (!config || !config.explorerUrl || config.explorerUrl.includes('localhost')) {
    return `https://testnet.snowtrace.io/tx/${txHash}`
  }
  return `${config.explorerUrl}/tx/${txHash}`
}

export function handleTxSuccess(
  title: string,
  txHash: string,
  chainId: number = 43113,
  celebrate: boolean = false
) {
  if (celebrate) {
    triggerConfetti()
  }

  const explorerUrl = getExplorerTxUrl(chainId, txHash)

  toast.success(title, {
    description: `Tx: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
    action: {
      label: 'Ver Explorer',
      onClick: () => window.open(explorerUrl, '_blank'),
    },
    duration: 6000,
  })
}

export function handleTxError(error: any, fallbackMessage: string = 'Transacción fallida') {
  console.error('Web3 Transaction Error:', error)
  let message = fallbackMessage

  if (error?.message) {
    if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
      message = 'Transacción cancelada en la billetera'
    } else if (error.message.includes('insufficient funds')) {
      message = 'Fondos insuficientes para gas o tokens'
    } else if (error.message.includes('Invalid secret code')) {
      message = 'PIN secreto incorrecto. No coincide con el hash.'
    } else if (error.message.includes('Deadline must be in future')) {
      message = 'La fecha límite debe ser futura'
    } else if (error.message.includes('Buyer cannot be seller')) {
      message = 'El comprador y el vendedor no pueden ser la misma dirección'
    } else if (error.shortMessage) {
      message = error.shortMessage
    }
  }

  toast.error(message, { duration: 5000 })
}
