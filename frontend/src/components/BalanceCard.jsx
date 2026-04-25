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
      <div className="rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-rose-600">{String(error)}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading balance…</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Available
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold text-slate-900">
          ₹{r(data.available_paise)}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          In transit
        </p>
        <p className="mt-1 font-mono text-xl text-amber-800">₹{r(data.held_paise)}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Net ledger
        </p>
        <p className="mt-1 font-mono text-xl text-slate-800">₹{r(data.net_paise)}</p>
      </div>
    </div>
  );
}
