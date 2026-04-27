import React from "react";

function r(paise) {
  return (Number(paise) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const badge = (type) => {
  if (type === "credit")
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  return "bg-rose-500/10 text-rose-400 border-rose-500/20";
};

export default function TransactionTable({ rows, error }) {
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-xl p-6 shadow-[0_4px_30px_rgba(225,29,72,0.1)]">
        <p className="text-sm font-medium text-rose-400">{String(error)}</p>
      </div>
    );
  }
  const data = (rows || []).slice(0, 20);
  
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
        <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <p className="text-sm text-slate-400">No ledger records found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl relative">
      <table className="min-w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 sticky top-0 backdrop-blur-md">
          <tr>
            <th className="px-6 py-4 rounded-tl-2xl">Type</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Description</th>
            <th className="px-6 py-4 rounded-tr-2xl">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((e) => (
            <tr key={e.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badge(
                    e.entry_type
                  )}`}
                >
                  <span className={`w-1 h-1 rounded-full ${e.entry_type === "credit" ? "bg-emerald-400" : "bg-rose-400"}`} />
                  {e.entry_type}
                </span>
              </td>
              <td className={`px-6 py-4 font-mono font-medium ${e.entry_type === "credit" ? "text-emerald-400" : "text-rose-400"}`}>
                {e.entry_type === "credit" ? "+" : "-"}₹{r(e.amount_paise)}
              </td>
              <td className="px-6 py-4 text-slate-300">
                {e.description}
              </td>
              <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
