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
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold">Playto Payout</h1>
          <p className="text-xs text-slate-400">Merchant console</p>
        </div>
        <div>
          <label className="text-xs text-slate-400">API token (from seed_data)</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token …"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <nav className="text-sm text-slate-300">
          <div className="font-medium">Overview</div>
        </nav>
        <div className="mt-auto text-xs text-slate-500">Polling: balance 5s · payouts 3s</div>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-5xl space-y-8">
          <header>
            <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
            <p className="text-slate-500">Balances update automatically.</p>
          </header>
          <section>
            <h3 className="mb-2 text-sm font-medium text-slate-700">Balances</h3>
            <BalanceCard data={hasToken ? bal : null} error={hasToken ? balErr : "Enter a token."} />
          </section>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">Payout</h3>
              <PayoutForm
                onSuccess={() => {
                  void reloadBal();
                  void loadTx();
                  void reloadPayouts();
                }}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">Recent ledger</h3>
              <TransactionTable rows={tx} error={txErr} />
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-700">Payouts</h3>
            <PayoutHistory rows={payouts} error={hasToken ? payErr : null} />
          </div>
        </div>
      </main>
    </div>
  );
}
