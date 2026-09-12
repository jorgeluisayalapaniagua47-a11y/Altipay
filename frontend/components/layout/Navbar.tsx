"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { Zap, Package, Truck, ShieldCheck, Home } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/create", label: "Crear Custodia", icon: Package },
    { href: "/seller", label: "Panel Vendedor", icon: Truck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface-dark/95 backdrop-blur-md border-b border-surface-border px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">AltiPay</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                PayFi Bolivia
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Custodia no custodial para encomiendas terrestres
            </p>
          </div>
        </Link>

        {/* Navegación Principal */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-card border border-surface-border p-1 rounded-xl">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet & Acciones */}
        <div className="flex items-center gap-3">
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
