import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Copy, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { PaymentService, PaymentMethodConfig } from '@/services/payment.service';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  creditAmount: number;
  priceUSD: number;
}

type Step = 'select_method' | 'payment_details' | 'upload_proof' | 'confirmation';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  planName,
  creditAmount,
  priceUSD,
}) => {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodConfig | null>(null);
  const [step, setStep] = useState<Step>('select_method');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('select_method');
      setSelectedMethod(null);
      setProofFile(null);
      setProofPreview(null);
      setTxHash('');
      loadMethods();
    }
  }, [isOpen]);

  const loadMethods = async () => {
    setLoading(true);
    const data = await PaymentService.getPaymentMethods();
    setMethods(data);
    setLoading(false);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod) return;

    const isCrypto = selectedMethod.id.includes('crypto');
    if (isCrypto && !txHash.trim()) {
      alert('Please enter the transaction hash');
      return;
    }
    if (!isCrypto && !proofFile) {
      alert('Please upload a proof of payment');
      return;
    }

    setSubmitting(true);
    try {
      const result = await PaymentService.submitPayment(
        creditAmount,
        selectedMethod.id,
        proofFile || undefined,
        txHash || undefined,
        planName ? `${planName} Plan - ${creditAmount} Credits` : `${creditAmount} Credits`
      );

      if (result.success) {
        setStep('confirmation');
      } else {
        alert(result.message);
      }
    } catch (e) {
      alert('Error submitting payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isCrypto = selectedMethod?.id.includes('crypto');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {step !== 'select_method' && step !== 'confirmation' && (
              <button
                onClick={() => {
                  if (step === 'upload_proof') setStep('payment_details');
                  else setStep('select_method');
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold">
                {step === 'confirmation' ? 'Payment Submitted' : 'Buy Credits'}
              </h2>
              {planName && step !== 'confirmation' && (
                <p className="text-xs text-gray-500">{planName} Plan</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* Amount Badge */}
        {step !== 'confirmation' && (
          <div className="px-6 pt-4">
            <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center border border-white/5">
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold">You'll receive</span>
                <div className="text-2xl font-bold text-emerald-400">
                  {creditAmount.toLocaleString()} <span className="text-sm text-gray-500">CR</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase font-bold">Price</span>
                <div className="text-2xl font-bold text-white">
                  ${priceUSD.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* STEP 1: Select Method */}
          {step === 'select_method' && (
            <div>
              <p className="text-sm text-gray-400 mb-4">Select a payment method:</p>
              {loading ? (
                <div className="text-center py-8 text-gray-500 animate-pulse">Loading methods...</div>
              ) : methods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No payment methods available</div>
              ) : (
                <div className="space-y-3">
                  {methods.map(method => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedMethod(method);
                        setStep('payment_details');
                      }}
                      className="w-full flex items-center justify-between p-4 bg-[#111] border border-white/10 rounded-xl hover:border-white/30 hover:bg-[#151515] transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                          {method.id.includes('mercadopago') ? '🏦' : '💎'}
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-white">{method.label}</div>
                          <div className="text-xs text-gray-500">
                            {method.data.network || 'Bank Transfer'}
                          </div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Payment Details */}
          {step === 'payment_details' && selectedMethod && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                {selectedMethod.data.instructions || 'Send the exact amount and proceed to upload proof.'}
              </p>

              {/* Payment Info Fields */}
              <div className="space-y-3 mb-6">
                {selectedMethod.data.alias && (
                  <CopyField
                    label="Alias"
                    value={selectedMethod.data.alias}
                    onCopy={handleCopy}
                    copied={copied}
                  />
                )}
                {selectedMethod.data.cvu && (
                  <CopyField
                    label="CVU"
                    value={selectedMethod.data.cvu}
                    onCopy={handleCopy}
                    copied={copied}
                  />
                )}
                {selectedMethod.data.wallet_address && (
                  <CopyField
                    label={`Wallet (${selectedMethod.data.network || 'Crypto'})`}
                    value={selectedMethod.data.wallet_address}
                    onCopy={handleCopy}
                    copied={copied}
                  />
                )}
              </div>

              {/* QR Code */}
              {selectedMethod.data.qr_url && (
                <div className="flex justify-center mb-6">
                  <img
                    src={selectedMethod.data.qr_url}
                    alt="QR Code"
                    className="w-48 h-48 rounded-xl border border-white/10 bg-white p-2 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <button
                onClick={() => setStep('upload_proof')}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition text-sm"
              >
                I've made the payment →
              </button>
            </div>
          )}

          {/* STEP 3: Upload Proof */}
          {step === 'upload_proof' && selectedMethod && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                {isCrypto
                  ? 'Paste the transaction hash and optionally upload a screenshot.'
                  : 'Upload a screenshot of your payment receipt.'}
              </p>

              {/* TX Hash (Crypto) */}
              {isCrypto && (
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-1">
                    Transaction Hash *
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={e => setTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-white/30 transition"
                  />
                </div>
              )}

              {/* File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  proofPreview
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/10 hover:border-white/30 bg-[#111]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {proofPreview ? (
                  <div>
                    <img
                      src={proofPreview}
                      alt="Proof"
                      className="max-h-40 mx-auto rounded-lg mb-2 object-contain"
                    />
                    <p className="text-xs text-emerald-400 font-bold">
                      ✓ {proofFile?.name}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">
                      Click to upload receipt
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || (isCrypto ? !txHash.trim() : !proofFile)}
                className="w-full py-3 mt-6 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Payment'
                )}
              </button>
            </div>
          )}

          {/* STEP 4: Confirmation */}
          {step === 'confirmation' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Payment Submitted!</h3>
              <p className="text-gray-400 text-sm mb-6">
                Your payment is being reviewed by our team.<br />
                Credits will be added once approved.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition text-sm"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Helper: Copiable field ──
const CopyField = ({
  label,
  value,
  onCopy,
  copied
}: {
  label: string;
  value: string;
  onCopy: (text: string, label: string) => void;
  copied: string | null;
}) => (
  <div className="bg-[#111] border border-white/10 rounded-lg p-3">
    <div className="text-xs text-gray-500 uppercase font-bold mb-1">{label}</div>
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-mono text-white truncate">{value}</span>
      <button
        onClick={() => onCopy(value, label)}
        className="shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition"
        title="Copy"
      >
        {copied === label ? (
          <CheckCircle size={14} className="text-emerald-400" />
        ) : (
          <Copy size={14} className="text-gray-500" />
        )}
      </button>
    </div>
  </div>
);
