import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getTransactions } from "../api/endpoints.js";
import BalanceCard from "../components/BalanceCard.jsx";
import PayoutForm from "../components/PayoutForm.jsx";
import PayoutHistory from "../components/PayoutHistory.jsx";
import TransactionTable from "../components/TransactionTable.jsx";
import { setAuthToken } from "../api/client.js";
import { useBalance } from "../hooks/useBalance.js";
import { usePayouts } from "../hooks/usePayouts.js";

const TOKEN_KEY = "playto_token";

export default function Dashboard() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [tx, setTx] = useState([]);
  const [txErr, setTxErr] = useState(null);
  const hasToken = useMemo(() => token.trim().length > 0, [token]);

  useEffect(() => {
    setAuthToken(token.trim() || null);
    if (token.trim()) localStorage.setItem(TOKEN_KEY, token.trim());
  }, [token]);

  const { data: bal, err: balErr, reload: reloadBal } = useBalance(hasToken);
  const { data: payouts, err: payErr, reload: reloadPayouts } = usePayouts(hasToken);

  const loadTx = useCallback(async () => {
    if (!hasToken) return;
    setTxErr(null);
    const { data } = await getTransactions(1);
    setTx(data.results || data);
  }, [hasToken]);

  useEffect(() => {
    void loadTx();
  }, [loadTx]);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      <aside className="w-64 shrink-0 bg-white/[0.02] backdrop-blur-3xl border-r border-white/10 p-6 flex flex-col gap-6 relative z-10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Playto Payout</h1>
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Merchant Console</p>
          </div>
        </div>
        
        <div className="mt-8">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">API Authorization</label>
          <div className="relative">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 shadow-inner"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter seed token..."
              autoComplete="off"
              spellCheck={false}
              type="password"
            />
            {hasToken && <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
          </div>
        </div>
        
        <nav className="text-sm text-slate-400 mt-4 space-y-2">
          <div className="font-medium text-white bg-white/5 px-3 py-2 rounded-lg border border-white/5 cursor-default flex items-center justify-between">
            Overview
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
          </div>
        </nav>
        
        <div className="mt-auto px-3 py-2 rounded-lg bg-black/20 border border-white/5 text-xs text-slate-500 flex items-center gap-2">
          <svg className="w-3 h-3 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Polling: 5s / 3s
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-12 relative overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f18] to-black">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-[20%] w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-10 relative z-10">
          <header className="flex justify-between items-end border-b border-white/10 pb-6">
            <div>
              <h2 className="text-3xl font-semibold text-white tracking-tight">Dashboard Overview</h2>
              <p className="text-slate-400 mt-1">Live financial and ledger metrics.</p>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Secure
            </div>
          </header>
          
          <section>
            <h3 className="mb-4 text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              Balances
            </h3>
            <BalanceCard data={hasToken ? bal : null} error={hasToken ? balErr : "Enter a token to unlock metrics."} />
          </section>
          
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-5">
              <h3 className="mb-4 text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Initiate Payout
              </h3>
              <PayoutForm
                onSuccess={() => {
                  void reloadBal();
                  void loadTx();
                  void reloadPayouts();
                }}
              />
            </div>
            <div className="lg:col-span-7">
              <h3 className="mb-4 text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Recent Ledger Activity
              </h3>
              <TransactionTable rows={tx} error={txErr} />
            </div>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Payout Logistics
            </h3>
            <PayoutHistory rows={payouts} error={hasToken ? payErr : null} />
          </div>
        </div>
      </main>
    </div>
  );
}
