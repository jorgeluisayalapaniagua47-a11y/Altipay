export function AltipayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M50 15L20 25V50C20 70 35 85 50 95C65 85 80 70 80 50V25L50 15Z" fill="url(#shield-grad)" stroke="url(#shield-stroke)" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M57 30L35 55H50L45 75L68 45H50L57 30Z" fill="#14F195" />
      <defs>
        <linearGradient id="shield-grad" x1="20" y1="15" x2="80" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D9488" stopOpacity="0.1" />
          <stop offset="1" stopColor="#14F195" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="shield-stroke" x1="20" y1="15" x2="80" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D9488" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
    </svg>
  )
}
