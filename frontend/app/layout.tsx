import type { Metadata } from "next";
import { Web3Provider } from "@/components/web3/Web3Provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AltiPay Protocol — Custodia Comercial y Encomiendas (PayFi)",
  description:
    "Infraestructura no custodial de pagos en stablecoins garantizados para encomiendas terrestres en Bolivia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        <Web3Provider>
          {children}
          <Toaster richColors position="top-right" theme="dark" />
        </Web3Provider>
      </body>
    </html>
  );
}
