import { toast } from "sonner";

export interface TransactionOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  chainId?: number;
}

/**
 * Obtiene la URL del explorador de bloques para una transacción según la red
 */
export function getExplorerTxUrl(txHash: string, chainId?: number): string {
  if (chainId === 43113) {
    return `https://testnet.snowtrace.io/tx/${txHash}`;
  }
  // Default: HashKey Chain Testnet (133)
  return `https://hashkeychain-testnet-explorer.alt.technology/tx/${txHash}`;
}

/**
 * Formatea errores comunes de Web3/EVM de manera legible para el usuario
 */
export function formatWeb3Error(error: any): string {
  if (!error) return "Ocurrió un error inesperado al procesar la transacción.";

  const message = error.message || error.details || String(error);

  if (message.includes("User rejected") || message.includes("User denied") || message.includes("ACTION_REJECTED")) {
    return "Firma cancelada por el usuario en la billetera.";
  }

  if (message.includes("insufficient funds") || message.includes("exceeds balance")) {
    return "Fondos insuficientes para cubrir el gas o el monto de la transacción.";
  }

  if (message.includes("InvalidSecret") || message.includes("invalid secret")) {
    return "El código secreto (PIN) ingresado no coincide con el hash de la orden.";
  }

  if (message.includes("OrderNotFunded")) {
    return "La orden no se encuentra en estado fondeada.";
  }

  if (message.includes("DeadlineNotPassed")) {
    return "El plazo de entrega de la orden aún no ha expirado.";
  }

  if (message.includes("Unauthorized")) {
    return "No tienes autorización para ejecutar esta acción en la orden.";
  }

  return message.slice(0, 120);
}

/**
 * Ejecuta una acción transaccional mostrando notificaciones de progreso, éxito o error
 */
export async function executeTransaction<T extends { txHash?: string } | string>(
  asyncFn: () => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const {
    loadingMessage = "Enviando transacción a la blockchain...",
    successMessage = "¡Transacción confirmada en bloque!",
    errorMessage,
    chainId = 133,
  } = options;

  const toastId = toast.loading(loadingMessage);

  try {
    const result = await asyncFn();
    const hash = typeof result === "string" ? result : result?.txHash;

    toast.dismiss(toastId);

    if (hash) {
      const explorerUrl = getExplorerTxUrl(hash, chainId);
      toast.success(successMessage, {
        description: `Tx: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
        action: {
          label: "Ver Explorer",
          onClick: () => window.open(explorerUrl, "_blank"),
        },
      });
    } else {
      toast.success(successMessage);
    }

    return result;
  } catch (error: any) {
    toast.dismiss(toastId);
    const friendlyError = errorMessage || formatWeb3Error(error);
    toast.error("Error en la transacción", {
      description: friendlyError,
    });
    throw error;
  }
}
