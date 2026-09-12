"use client";

import React from "react";
import { useUnlockVIP } from "@/hooks/useUnlockVIP";
import { Sparkles, ShieldCheck, ExternalLink, Key, RefreshCw } from "lucide-react";

interface UnlockVIPBadgeProps {
  className?: string;
  showToggle?: boolean;
}

/**
 * Componente oficial de token-gating de Unlock Protocol para AltiPay
 * Muestra el estatus de membresía comercial y la tasa de comisión (0% con VIP Key)
 */
export function UnlockVIPBadge({ className = "", showToggle = true }: UnlockVIPBadgeProps) {
  const {
    isVIP,
    isSimulatedVIP,
    toggleSimulatedVIP,
    feePercent,
    vipLockAddress,
    isLoading,
  } = useUnlockVIP();

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border text-xs text-slate-400 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        <span>Verificando membresía Unlock Protocol...</span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 ${
        isVIP
          ? "bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-amber-500/40 shadow-sm shadow-amber-500/10"
          : "bg-surface-card border-surface-border"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
              isVIP
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                : "bg-slate-800 border border-slate-700 text-slate-400"
            }`}
          >
            {isVIP ? <Sparkles className="w-5 h-5" /> : <Key className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {isVIP ? "Membresía AltiPay VIP Activa" : "Tarifa Estándar: 0.5%"}
              </h4>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide border ${
                  isVIP
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {isVIP ? "0% FEE" : "0.5% FEE"}
              </span>
              {isSimulatedVIP && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Modo Demo
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isVIP
                ? "Disfrutas de custodia comercial sin comisión gracias a tu NFT Key de Unlock Protocol."
                : "Los comercios con membresía NFT de Unlock Protocol obtienen 0% de comisión en todas sus custodias."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showToggle && (
            <button
              onClick={toggleSimulatedVIP}
              type="button"
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Alternar modo VIP para demostración en hackathon"
            >
              <RefreshCw className="w-3 h-3 text-brand-400" />
              <span>{isVIP ? "Desactivar VIP" : "Simular VIP (Demo)"}</span>
            </button>
          )}

          {vipLockAddress ? (
            <a
              href={`https://app.unlock-protocol.com/checkout?id=${vipLockAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 flex items-center gap-1 transition-colors"
            >
              <span>{isVIP ? "Ver Lock NFT" : "Adquirir Key"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <a
              href="https://unlock-protocol.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 flex items-center gap-1 transition-colors"
            >
              <span>Unlock Protocol</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
