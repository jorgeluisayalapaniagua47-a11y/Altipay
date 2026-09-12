"use client";

import React from "react";
import { useUnlockVIP } from "@/hooks/useUnlockVIP";
import { Sparkles, ShieldCheck, ExternalLink, Key } from "lucide-react";

interface UnlockVIPBadgeProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Componente oficial de token-gating de Unlock Protocol para AltiPay
 * Muestra el estatus de membresía comercial y la tasa de comisión (0% con VIP Key)
 */
export function UnlockVIPBadge({ className = "", showDetails = false }: UnlockVIPBadgeProps) {
  const { isVIP, feePercent, statusText, vipLockAddress, isLoading } = useUnlockVIP();

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border text-xs text-slate-400 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        <span>Verificando membresía Unlock...</span>
      </div>
    );
  }

  if (isVIP) {
    return (
      <div
        className={`p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                Membresía VIP Activa
              </h4>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                0% FEE
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Disfrutas de custodia sin comisiones gracias a Unlock Protocol.
            </p>
          </div>
        </div>

        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
      </div>
    );
  }

  return (
    <div
      className={`p-3.5 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
          <Key className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-semibold text-slate-200">
              Tarifa Estándar: {feePercent}%
            </h4>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
              Standard
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Obtén la VIP Key de Unlock Protocol para transferir con <strong>0% de comisión</strong>.
          </p>
        </div>
      </div>

      {vipLockAddress && (
        <a
          href={`https://app.unlock-protocol.com/checkout?id=${vipLockAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 whitespace-nowrap"
        >
          <span>Adquirir VIP</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
