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
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "failed":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    case "pending":
    case "processing":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
};

export default function PayoutHistory({ rows, error }) {
  if (error) {
    return <p className="text-sm text-rose-600">{String(error)}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">To</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((p) => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="px-4 py-2 font-mono text-xs text-slate-600">
                {String(p.id).slice(0, 8)}…
              </td>
              <td className="px-4 py-2 font-mono">₹{r(p.amount_paise)}</td>
              <td className="px-4 py-2 text-slate-600">{p.bank_account_id}</td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${styleFor(
                    p.status
                  )}`}
                >
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-2 text-slate-500">
                {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
