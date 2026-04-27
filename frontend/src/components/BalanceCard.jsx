import React from "react";

function r(paise) {
  return (Number(paise) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BalanceCard({ data, error }) {
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-xl p-6 shadow-[0_4px_30px_rgba(225,29,72,0.1)]">
        <p className="text-sm font-medium text-rose-400">{String(error)}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.1)] animate-pulse">
        <p className="text-sm font-medium text-slate-400">Syncing ledger records…</p>
      </div>
    );
  }
  return (
    <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_4px_30px_rgba(0,0,0,0.1)] sm:grid-cols-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <svg className="w-32 h-32 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.97-1.3-3.06-2.61-3.36V4h-2v2.07C9.5 6.32 8.1 7.41 8.1 9.15c0 2.22 1.83 2.97 4.29 3.56 1.93.47 2.45 1.11 2.45 1.93 0 1-.95 1.55-2.28 1.55-1.46 0-2.3-.77-2.36-1.85H8.49c.07 2.05 1.48 3.16 2.62 3.48V20h2v-2.06c1.37-.25 3.01-1.12 3.01-3.14 0-1.83-1.07-2.88-3.81-3.66z"/></svg>
      </div>

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Available Funds
        </p>
        <p className="mt-2 font-mono text-4xl font-light text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
          ₹{r(data.available_paise)}
        </p>
      </div>
      <div className="relative z-10 border-l border-white/10 pl-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          In Transit
        </p>
        <p className="mt-2 font-mono text-2xl font-light text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]">
          ₹{r(data.held_paise)}
        </p>
      </div>
      <div className="relative z-10 border-l border-white/10 pl-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Net Ledger
        </p>
        <p className="mt-2 font-mono text-2xl font-light text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)]">
          ₹{r(data.net_paise)}
        </p>
      </div>
    </div>
  );
}
