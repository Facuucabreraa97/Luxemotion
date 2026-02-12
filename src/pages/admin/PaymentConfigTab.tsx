import React, { useState, useEffect, useRef } from 'react';
import { PaymentService, PaymentMethodConfig } from '@/services/payment.service';
import { RefreshCw, Save, ToggleLeft, ToggleRight, Plus, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const PaymentConfigTab = () => {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState<string | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [qrUploadTargetId, setQrUploadTargetId] = useState<string | null>(null);

  // New method form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setLoading(true);
    const data = await PaymentService.getAllPaymentMethods();
    setMethods(data);
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFieldChange = (id: string, field: string, value: string) => {
    setMethods(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, data: { ...m.data, [field]: value } }
          : m
      )
    );
  };

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      await PaymentService.updatePaymentMethod(id, { enabled: !currentEnabled });
      setMethods(prev =>
        prev.map(m => (m.id === id ? { ...m, enabled: !currentEnabled } : m))
      );
      showToast(`${id} ${!currentEnabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      showToast('Error toggling method');
    }
  };

  const handleSave = async (method: PaymentMethodConfig) => {
    setSaving(method.id);
    try {
      await PaymentService.updatePaymentMethod(method.id, {
        data: method.data,
        support_whatsapp_number: method.support_whatsapp_number || ''
      } as Partial<PaymentMethodConfig>);
      showToast(`${method.label} saved ✓`);
    } catch (e) {
      showToast('Error saving');
    } finally {
      setSaving(null);
    }
  };

  const handleCreateMethod = async () => {
    if (!newId.trim() || !newLabel.trim()) return;
    try {
      await PaymentService.createPaymentMethod({
        id: newId.toLowerCase().replace(/\s+/g, '_'),
        label: newLabel,
        enabled: true,
        data: { instructions: '' },
        display_order: methods.length + 1
      });
      showToast('Payment method created');
      setShowNewForm(false);
      setNewId('');
      setNewLabel('');
      loadMethods();
    } catch (e) {
      showToast('Error creating method');
    }
  };

  const handleQrUpload = async (methodId: string, file: File) => {
    setUploadingQr(methodId);
    try {
      const fileName = `qr_${methodId}_${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `qr-codes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payments')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        showToast('Error uploading QR: ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('payments')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update local state
      handleFieldChange(methodId, 'qr_url', publicUrl);
      showToast('QR uploaded! Click Save to persist.');
    } catch (e) {
      showToast('Error uploading QR image');
    } finally {
      setUploadingQr(null);
    }
  };

  const getFieldsForMethod = (method: PaymentMethodConfig) => {
    const fields: { key: string; label: string; type: 'text' | 'textarea' }[] = [];
    const id = method.id;

    if (id.includes('mercadopago')) {
      fields.push(
        { key: 'alias', label: 'Alias', type: 'text' },
        { key: 'cvu', label: 'CVU', type: 'text' },
        { key: 'qr_url', label: 'QR Image URL', type: 'text' },
        { key: 'instructions', label: 'Instructions', type: 'textarea' }
      );
    } else if (id.includes('crypto')) {
      fields.push(
        { key: 'wallet_address', label: 'Wallet Address', type: 'text' },
        { key: 'network', label: 'Network', type: 'text' },
        { key: 'qr_url', label: 'QR Image URL', type: 'text' },
        { key: 'instructions', label: 'Instructions', type: 'textarea' }
      );
    } else {
      // Generic: show all keys in data
      Object.keys(method.data).forEach(k => {
        fields.push({ key: k, label: k, type: k === 'instructions' ? 'textarea' : 'text' });
      });
    }

    return fields;
  };

  if (loading) {
    return <div className="text-gray-500 animate-pulse text-center py-16">Loading payment config...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Payment Methods</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition text-sm font-bold"
          >
            <Plus size={16} /> Add Method
          </button>
          <button
            onClick={loadMethods}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-black font-bold px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* New Method Form */}
      {showNewForm && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 mb-6 animate-fade-in">
          <h3 className="text-lg font-bold mb-4">Add New Payment Method</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase font-bold mb-1">ID (slug)</label>
              <input
                type="text"
                value={newId}
                onChange={e => setNewId(e.target.value)}
                placeholder="crypto_btc"
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Label</label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Bitcoin (BTC)"
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
          <button
            onClick={handleCreateMethod}
            className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition text-sm"
          >
            Create
          </button>
        </div>
      )}

      {/* Method Cards */}
      <div className="space-y-6">
        {methods.map(method => (
          <div
            key={method.id}
            className={`bg-[#111] border rounded-xl p-6 transition ${
              method.enabled ? 'border-white/10' : 'border-white/5 opacity-50'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold">{method.label}</h3>
                <span className="text-xs text-gray-600 font-mono bg-white/5 px-2 py-0.5 rounded">
                  {method.id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(method.id, method.enabled)}
                  className="transition hover:scale-110"
                  title={method.enabled ? 'Disable' : 'Enable'}
                >
                  {method.enabled ? (
                    <ToggleRight size={28} className="text-emerald-400" />
                  ) : (
                    <ToggleLeft size={28} className="text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFieldsForMethod(method).map(field => (
                <div key={field.key} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-1 tracking-wider">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={(method.data as Record<string, string>)[field.key] || ''}
                      onChange={e => handleFieldChange(method.id, field.key, e.target.value)}
                      rows={2}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={(method.data as Record<string, string>)[field.key] || ''}
                      onChange={e => handleFieldChange(method.id, field.key, e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* QR Preview + Upload */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 uppercase font-bold mb-2">QR Code</label>
              <div className="flex items-end gap-4">
                {method.data.qr_url ? (
                  <img
                    src={method.data.qr_url}
                    alt="QR Code"
                    className="w-32 h-32 rounded-lg border border-white/10 bg-white p-1 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg border border-dashed border-white/20 bg-white/5 flex items-center justify-center text-gray-600 text-xs">
                    No QR
                  </div>
                )}
                <div>
                  <input
                    ref={qrUploadTargetId === method.id ? qrInputRef : undefined}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleQrUpload(method.id, file);
                    }}
                  />
                  <button
                    onClick={() => {
                      setQrUploadTargetId(method.id);
                      setTimeout(() => qrInputRef.current?.click(), 50);
                    }}
                    disabled={uploadingQr === method.id}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 text-gray-300 border border-white/10 rounded-lg hover:bg-white/10 transition text-xs font-bold disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {uploadingQr === method.id ? 'Uploading...' : 'Upload QR'}
                  </button>
                  <p className="text-[10px] text-gray-600 mt-1">Or paste URL above</p>
                </div>
              </div>
            </div>

            {/* WhatsApp Support Number */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 uppercase font-bold mb-1 tracking-wider">
                💬 WhatsApp Support Number
              </label>
              <input
                type="text"
                value={method.support_whatsapp_number || ''}
                onChange={e => {
                  setMethods(prev => prev.map(m =>
                    m.id === method.id ? { ...m, support_whatsapp_number: e.target.value } : m
                  ));
                }}
                placeholder="5491123456789 (international, no +)"
                className="w-full max-w-sm bg-black border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-white/30 transition"
              />
              <p className="text-[10px] text-gray-600 mt-1">Users will see a "Confirm by WhatsApp" button after payment</p>
            </div>

            {/* Save */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleSave(method)}
                disabled={saving === method.id}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition text-sm disabled:opacity-50"
              >
                <Save size={14} />
                {saving === method.id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
