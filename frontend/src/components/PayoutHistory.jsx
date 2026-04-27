import React from "react";

function r(paise) {
  return (Number(paise) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const styleFor = (s) => {
  switch (s) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
    case "failed":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(225,29,72,0.1)]";
    case "pending":
    case "processing":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
};

export default function PayoutHistory({ rows, error }) {
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-xl p-6 shadow-[0_4px_30px_rgba(225,29,72,0.1)]">
        <p className="text-sm font-medium text-rose-400">{String(error)}</p>
      </div>
    );
  }
  
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
        <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        <p className="text-sm text-slate-400">No outbound payouts registered.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl relative">
      <table className="min-w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 sticky top-0 backdrop-blur-md">
          <tr>
            <th className="px-6 py-4 rounded-tl-2xl">TXN ID</th>
            <th className="px-6 py-4">Total Settled</th>
            <th className="px-6 py-4">Routing Dest</th>
            <th className="px-6 py-4">State</th>
            <th className="px-6 py-4 rounded-tr-2xl">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {(rows || []).map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-6 py-4 font-mono text-xs text-slate-500 flex items-center gap-2">
                <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                {String(p.id).slice(0, 12)}…
              </td>
              <td className="px-6 py-4 font-mono font-medium text-emerald-400 drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]">₹{r(p.amount_paise)}</td>
              <td className="px-6 py-4 text-slate-300 font-mono text-xs bg-black/20 rounded px-2">{p.bank_account_id}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styleFor(
                    p.status
                  )}`}
                >
                  {p.status === "processing" && <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  {p.status === "completed" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />}
                  {p.status === "failed" && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]" />}
                  {p.status === "pending" && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(59,130,246,0.8)]" />}
                  {p.status}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
