// // components/CreditsPage.tsx
// import { useState, useEffect } from 'react';
// import { useLocation } from 'react-router-dom';
// import { useQueryClient } from '@tanstack/react-query';
// import { useCreditPackages, useWallet, initiateCheckout } from '@/hooks/useWallet';
// import type { CreditPackage } from '@/types/wallet';

// export default function CreditsPage() {
//   const { wallet, loading: walletLoading } = useWallet();
//   const { packages, loading: pkgsLoading } = useCreditPackages();
//   const [purchasing, setPurchasing] = useState<number | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [justPurchased, setJustPurchased] = useState(false);

//   const queryClient = useQueryClient()
//   const location = useLocation()

// useEffect(() => {
//   if (location.pathname.startsWith('/credits')) {
//     // Force immediate refetch, don't just mark stale
//     queryClient.refetchQueries({ queryKey: ['wallet'] })
//     setJustPurchased(true)
//   }
// }, [])

//   async function handlePurchase(pkg: CreditPackage) {
//     setPurchasing(pkg.id);
//     setError(null);
//     try {
//       const { checkout_url } = await initiateCheckout(pkg.id);
//       window.location.href = checkout_url;
//     } catch {
//       setError('Could not open checkout. Please try again.');
//       setPurchasing(null);
//     }
//   }

//   if (walletLoading || pkgsLoading) {
//     return <div className="credits-loading">Loading…</div>;
//   }

//   return (
//     <div className="credits-page">
//       <header className="credits-header">
//         <h1>Top Up Credits</h1>
//         <div className="credits-balance">
//           Your balance: <strong>{wallet?.balance ?? 0} credits</strong>
//         </div>
//       </header>

//       {justPurchased && (
//         <div className="credits-success">
//           ✅ Payment successful! Your credits have been added.
//         </div>
//       )}

//       {error && <div className="credits-error">{error}</div>}

//       <div className="credits-packages">
//         {packages.map((pkg) => (
//           <div key={pkg.id} className="credits-package-card">
//             <div className="package-name">{pkg.name}</div>
//             <div className="package-credits">{pkg.credits} credits</div>
//             <div className="package-price">₱{Number(pkg.price).toFixed(2)}</div>
//             <button
//               className="package-buy-btn"
//               onClick={() => handlePurchase(pkg)}
//               disabled={purchasing === pkg.id}
//             >
//               {purchasing === pkg.id ? 'Opening checkout…' : 'Buy Now'}
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// components/CreditsPage.tsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCreditPackages, useWallet, initiateCheckout } from '@/hooks/useWallet';
import { useAuthStore } from '@/store/authStore';
import type { CreditPackage } from '@/types/wallet';

function getPackageStyle(index: number, total: number) {
  if (total >= 3 && index === Math.floor(total / 2)) {
    return {
      badge: 'POPULAR',
      badgeBg: '#e8a838',
      badgeColor: '#412402',
      icon: 'ti-coins',
      iconColor: '#e8a838',
      underline: '#e8a838',
      dark: false,
      btnBg: '#1a1a1a',
      btnColor: '#e8a838',
      btnShadow: '#f77c9b',
    };
  }
  if (index === total - 1) {
    return {
      badge: 'BEST VALUE',
      badgeBg: '#fffdf5',
      badgeColor: '#1a1a1a',
      icon: 'ti-diamond',
      iconColor: '#e8a838',
      underline: '#e8a838',
      dark: true,
      btnBg: '#e8a838',
      btnColor: '#412402',
      btnShadow: '#fffdf5',
    };
  }
  return {
    badge: 'STARTER',
    badgeBg: '#f77c9b',
    badgeColor: '#4b1528',
    icon: 'ti-coin',
    iconColor: '#f77c9b',
    underline: '#f77c9b',
    dark: false,
    btnBg: '#1a1a1a',
    btnColor: '#f77c9b',
    btnShadow: '#e8a838',
  };
}

export default function CreditsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { wallet, loading: walletLoading } = useWallet();
  const { packages, loading: pkgsLoading } = useCreditPackages();
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justPurchased, setJustPurchased] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Only show success banner if redirected back from checkout with ?success=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === '1') {
      queryClient.refetchQueries({ queryKey: ['wallet'] });
      setJustPurchased(true);
    }
  }, [location.search, queryClient]);

  if (!user) return null;

  if (walletLoading || pkgsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span
          className="text-[14px] tracking-[0.14em] text-foreground/50"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          LOADING&hellip;
        </span>
      </div>
    );
  }

  async function handlePurchase(pkg: CreditPackage) {
    setPurchasing(pkg.id);
    setError(null);
    try {
      const { checkout_url } = await initiateCheckout(pkg.id);
      window.location.href = checkout_url;
    } catch {
      setError('Could not open checkout. Please try again.');
      setPurchasing(null);
    }
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        {/* Wallet header card */}
        <div
          className="relative border-[3px] border-foreground bg-[#fffdf5] dark:bg-[#1e1b14] overflow-hidden mb-6"
          style={{ boxShadow: '6px 6px 0 var(--foreground)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '8px 8px',
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-[4px]"
            style={{
              background: 'linear-gradient(90deg, #e8a838 0%, #d97706 40%, #b45309 70%, #e8a838 100%)',
            }}
          />

          <div className="relative z-10 flex items-center justify-between px-4 sm:px-5 py-2 bg-foreground mt-1">
            <span
              className="text-[11px] tracking-[0.25em] text-[#f77c9b]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              ◆ PAPER LANTERN — WALLET
            </span>
            <span
              className="text-[10px] tracking-[0.18em] text-[#1a1a1a] bg-amber-400 px-2.5 py-0.5 border-2 border-foreground"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              TOP UP
            </span>
          </div>

          <div className="relative z-10 px-5 sm:px-6 py-6">
            <h1
              className="text-foreground leading-none"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(32px, 9vw, 48px)',
                letterSpacing: '0.01em',
              }}
            >
              TOP UP CREDITS
            </h1>

            <div
              className="inline-flex items-baseline gap-2 mt-3.5 border-[2.5px] border-foreground bg-[#fff8e7] dark:bg-[#2a2518] px-4 py-2.5"
              style={{ boxShadow: '3px 3px 0 var(--foreground)' }}
            >
              <span className="text-[12px] tracking-[0.1em] text-foreground/60">YOUR BALANCE</span>
              <span className="text-[22px] font-medium text-amber-600 dark:text-amber-400">
                {wallet?.balance ?? 0}
              </span>
              <span className="text-[12px] tracking-[0.1em] text-foreground/60">CREDITS</span>
            </div>

            {justPurchased && (
              <div className="mt-3.5 border-[2.5px] border-foreground bg-green-50 dark:bg-green-950/40 px-3.5 py-2.5 flex items-center gap-2.5">
                <i className="ti ti-check" aria-hidden="true" style={{ fontSize: '18px', color: '#27500a' }} />
                <span className="text-[12px] tracking-[0.04em]" style={{ color: '#173404' }}>
                  Payment successful! Your credits have been added.
                </span>
              </div>
            )}

            {error && (
              <div className="mt-3.5 border-[2.5px] border-foreground bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 flex items-center gap-2.5">
                <i className="ti ti-alert-circle" aria-hidden="true" style={{ fontSize: '18px', color: '#791f1f' }} />
                <span className="text-[12px] tracking-[0.04em]" style={{ color: '#501313' }}>
                  {error}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Package cards */}
        {packages.length === 0 ? (
          <div className="text-center py-10 text-foreground/40 text-[13px] tracking-[0.1em]">
            No packages available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {packages.map((pkg, i) => {
              const style = getPackageStyle(i, packages.length);
              return (
                <div
                  key={pkg.id}
                  className={`relative border-[2.5px] border-foreground p-4 text-center transition-transform duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_var(--foreground)] ${
                    style.dark ? 'bg-foreground' : 'bg-[#fffdf5] dark:bg-[#1e1b14]'
                  }`}
                >
                  <div
                    className="absolute border-2 border-foreground text-[10px] tracking-[0.08em] px-2 py-0.5"
                    style={{
                      background: style.badgeBg,
                      color: style.badgeColor,
                      top: '-0.5px',
                      right: '-0.5px',
                      transform: 'translate(4px, -8px) rotate(8deg)',
                    }}
                  >
                    {style.badge}
                  </div>

                  <i
                    className={`ti ${style.icon}`}
                    aria-hidden="true"
                    style={{ fontSize: '28px', color: style.iconColor, display: 'block', marginBottom: '8px' }}
                  />

                  <div className={`text-[22px] font-medium ${style.dark ? 'text-[#fffdf5]' : 'text-foreground'}`}>
                    {pkg.credits}
                  </div>
                  <div className={`text-[11px] mb-3 ${style.dark ? 'text-[#fffdf5]/50' : 'text-foreground/50'}`}>
                    credits
                  </div>

                  <div
                    className="h-[3px] mx-auto mb-3 w-1/2"
                    style={{ background: style.underline, transform: 'skewX(-8deg)' }}
                  />

                  <div className={`text-[16px] font-medium mb-3 ${style.dark ? 'text-[#fffdf5]' : 'text-foreground'}`}>
                    &#8369;{Number(pkg.price).toFixed(2)}
                  </div>

                  <button
                    className="w-full text-[12px] tracking-[0.12em] border-2 border-foreground py-2.5 transition-transform duration-150 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: style.btnBg,
                      color: style.btnColor,
                      boxShadow: `3px 3px 0 ${style.btnShadow}`,
                    }}
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasing === pkg.id}
                  >
                    {purchasing === pkg.id ? 'OPENING…' : 'BUY NOW'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between px-1 mt-5">
          <span
            className="text-muted-foreground/30 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            PAPER LANTERN PUBLISHING
          </span>
          <span
            className="text-muted-foreground/30 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            WALLET · V1.0
          </span>
        </div>
      </div>
    </>
  );
}