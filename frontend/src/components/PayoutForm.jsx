import React, { useState } from "react";
import { createPayout } from "../api/endpoints.js";

const ACCOUNTS = [
  { id: "HDFC_12345", label: "HDFC Current ••• 12345" },
  { id: "ICICI_90432", label: "ICICI Savings ••• 90432" },
  { id: "SBI_77821", label: "SBI Current ••• 77821" },
];

function newIdemKey() {
  return crypto.randomUUID();
}

export default function PayoutForm({ onSuccess }) {
  const [idempotencyKey, setIdempotencyKey] = useState(newIdemKey);
  const [rupees, setRupees] = useState("");
  const [account, setAccount] = useState(ACCOUNTS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    const rupeesNum = Number(String(rupees).replace(/,/g, ""));
    if (Number.isNaN(rupeesNum) || rupeesNum <= 0) {
      setIsError(true);
      setMessage("Enter a valid amount in rupees.");
      return;
    }
    const amountPaise = Math.round(rupeesNum * 100);
    setSubmitting(true);
    try {
      const { data, status } = await createPayout(
        { amount_paise: amountPaise, bank_account_id: account },
        idempotencyKey
      );
      if (status >= 200 && status < 300) {
        setMessage("Payout created.");
        setRupees("");
        setIdempotencyKey(newIdemKey());
        onSuccess?.(data);
      }
    } catch (err) {
      const d = err.response?.data;
      const m =
        (typeof d === "string" && d) ||
        d?.error ||
        d?.detail ||
        err.message ||
        "Request failed";
      setIsError(true);
      setMessage(String(m));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-slate-800">Request payout</h3>
      <div>
        <label className="block text-xs font-medium text-slate-500">Amount (INR)</label>
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-slate-900 outline-none ring-emerald-500/30 focus:ring-2"
          value={rupees}
          onChange={(e) => setRupees(e.target.value)}
          placeholder="e.g. 60.00"
        />
        <p className="mt-1 text-xs text-slate-400">Sent to API as paise (rupees × 100).</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Bank account</label>
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/30"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        >
          {ACCOUNTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-slate-500">
        Idempotency-Key:{" "}
        <code className="font-mono text-slate-700">{idempotencyKey}</code>
      </p>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit payout"}
      </button>
      {message && (
        <p
          className={`text-sm ${isError ? "text-rose-600" : "text-emerald-700"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
