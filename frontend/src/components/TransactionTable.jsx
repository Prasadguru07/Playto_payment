import React from "react";

function r(paise) {
  return (Number(paise) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const badge = (type) => {
  if (type === "credit")
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
};

export default function TransactionTable({ rows, error }) {
  if (error) {
    return <p className="text-sm text-rose-600">{String(error)}</p>;
  }
  const data = (rows || []).slice(0, 20);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e) => (
            <tr key={e.id} className="border-t border-slate-100">
              <td className="px-4 py-2">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${badge(
                    e.entry_type
                  )}`}
                >
                  {e.entry_type}
                </span>
              </td>
              <td className="px-4 py-2 font-mono text-slate-900">₹{r(e.amount_paise)}</td>
              <td className="px-4 py-2 text-slate-600">{e.description}</td>
              <td className="px-4 py-2 text-slate-500">
                {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
