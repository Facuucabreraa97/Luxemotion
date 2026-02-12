import React, { useState, useEffect } from 'react';
import { PaymentService, PendingPayment } from '@/services/payment.service';
import { Check, X, RefreshCw, ExternalLink, Clock, CheckCircle, XCircle, Gift } from 'lucide-react';

export const PaymentApprovalsTab = () => {
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [reviewed, setReviewed] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'pending' | 'history'>('pending');
  const [toast, setToast] = useState<string | null>(null);
  const [bonusAmounts, setBonusAmounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      PaymentService.getPendingPayments(),
      PaymentService.getReviewedPayments(30)
    ]);
    setPending(p);
    setReviewed(r);
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleReview = async (txId: string, decision: 'approved' | 'rejected') => {
    const overrideAmount = bonusAmounts[txId];
    const confirmMsg = decision === 'approved'
      ? `Approve this payment and credit the user with ${overrideAmount !== undefined ? overrideAmount : '(original)'} CR?`
      : 'Reject this payment? No credits will be added.';

    if (!window.confirm(confirmMsg)) return;

    setProcessing(txId);
    try {
      const result = await PaymentService.reviewPayment(
        txId,
        decision,
        overrideAmount !== undefined ? overrideAmount : undefined
      );
      if (result.success) {
        showToast(decision === 'approved' ? `✓ Payment approved (${overrideAmount ?? 'original'} CR)` : '✗ Payment rejected');
        loadPayments();
      } else {
        showToast(result.message);
      }
    } catch {
      showToast('Error processing review');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const methodLabel = (method: string) => {
    const labels: Record<string, string> = {
      mercadopago: '🏦 MercadoPago',
      crypto_usdt_trc20: '💎 USDT TRC-20',
      crypto_usdt_erc20: '💎 USDT ERC-20',
      crypto_btc: '₿ Bitcoin'
    };
    return labels[method] || method;
  };

  if (loading) {
    return <div className="text-gray-500 animate-pulse text-center py-16">Loading payments...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Payment Approvals</h2>
        <button onClick={loadPayments} className="p-2 hover:bg-white/10 rounded-lg transition">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-black font-bold px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveView('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeView === 'pending'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'
          }`}
        >
          <Clock size={14} className="inline mr-2" />
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeView === 'history'
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'
          }`}
        >
          History ({reviewed.length})
        </button>
      </div>

      {/* Pending Payments */}
      {activeView === 'pending' && (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-[#111] rounded-xl border border-white/10">
              No pending payments. All caught up! 🎉
            </div>
          ) : (
            pending.map(tx => (
              <div
                key={tx.id}
                className="bg-[#111] border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-emerald-400">
                        +{tx.amount.toLocaleString()} CR
                      </span>
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                        PENDING
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mb-1">{tx.user_email}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{methodLabel(tx.payment_method)}</span>
                      <span>{formatDate(tx.created_at)}</span>
                      {tx.tx_hash && (
                        <span className="font-mono truncate max-w-[140px]" title={tx.tx_hash}>
                          TX: {tx.tx_hash}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Proof */}
                  {tx.proof_url && (
                    <a
                      href={tx.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition shrink-0"
                    >
                      <ExternalLink size={12} /> View Proof
                    </a>
                  )}

                  {/* Bonus Amount Editor */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end">
                      <label className="text-[10px] text-gray-600 uppercase font-bold mb-1 flex items-center gap-1">
                        <Gift size={10} /> Final CR
                      </label>
                      <input
                        type="number"
                        value={bonusAmounts[tx.id] ?? tx.amount}
                        onChange={e => setBonusAmounts(prev => ({ ...prev, [tx.id]: parseInt(e.target.value) || 0 }))}
                        className="w-24 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition"
                        min={0}
                      />
                      {bonusAmounts[tx.id] !== undefined && bonusAmounts[tx.id] !== tx.amount && (
                        <span className="text-[9px] text-amber-400 mt-0.5">
                          original: {tx.amount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleReview(tx.id, 'approved')}
                      disabled={processing === tx.id}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition text-sm disabled:opacity-50"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleReview(tx.id, 'rejected')}
                      disabled={processing === tx.id}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white font-bold rounded-lg hover:bg-red-500/20 hover:text-red-400 transition text-sm disabled:opacity-50"
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History */}
      {activeView === 'history' && (
        <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
          {reviewed.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No reviewed payments yet</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0f0f0f] text-gray-500 text-xs uppercase font-bold">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reviewed.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/5 transition">
                    <td className="p-4 text-white">{tx.user_email}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      +{tx.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-400">{methodLabel(tx.payment_method)}</td>
                    <td className="p-4">
                      {tx.review_status === 'approved' ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                          <CheckCircle size={12} /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs font-bold">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
