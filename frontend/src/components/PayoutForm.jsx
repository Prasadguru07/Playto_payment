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
      className="space-y-5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      <div className="absolute -top-[100px] -right-[100px] w-[200px] h-[200px] bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/30 transition-all duration-500" />
      
      <div className="relative z-10 flex items-center gap-2 mb-2">
        <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
        <h3 className="text-base font-semibold text-white tracking-wide">Secure Transfer</h3>
      </div>
      
      <div className="relative z-10">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Amount (INR)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none">₹</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/50 pl-8 pr-3 py-2.5 font-mono text-emerald-400 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 shadow-inner"
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <p className="mt-1.5 text-[10px] text-slate-500 font-medium tracking-wide">Processed precisely in PAISE (×100)</p>
      </div>
      
      <div className="relative z-10">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Destination Bank Account</label>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-slate-300 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner font-mono text-sm"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          >
            {ACCOUNTS.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 text-slate-300">
                {a.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 p-3 rounded-lg border border-white/5 bg-white/[0.02] flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Idempotency Key</span>
        <code className="font-mono text-xs text-slate-400 break-all">{idempotencyKey}</code>
      </div>
      
      <button
        type="submit"
        disabled={submitting}
        className="relative z-10 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 p-[1px] shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group/btn"
      >
        <div className="relative bg-black/20 backdrop-blur-sm rounded-xl py-2.5 px-4 text-sm font-semibold text-white tracking-wide flex justify-center items-center gap-2 group-hover/btn:bg-transparent transition-colors">
          {submitting ? (
             <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...</>
          ) : (
            <>Initiate Transfer <svg className="w-4 h-4 translate-x-0 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></>
          )}
        </div>
      </button>
      
      {message && (
        <div className={`relative z-10 p-3 rounded-lg border backdrop-blur-md text-sm flex items-center gap-2 ${isError ? "border-rose-500/20 bg-rose-500/10 text-rose-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"}`} role="status">
          <svg className="shrink-0 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isError ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}></path></svg>
          <span className="font-medium tracking-wide">{message}</span>
        </div>
      )}
    </form>
  );
}
