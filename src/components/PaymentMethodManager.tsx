import React, { useState, useMemo } from 'react';
import { PaymentMethodConfig } from '../types';
import { INITIAL_PAYMENT_METHODS } from '../data/initialData';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  QrCode, 
  Upload, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Sparkles,
  Link,
  CheckCircle2,
  AlertCircle,
  Folder
} from 'lucide-react';
import { googleSheetsApi } from '../services/googleSheetsApi';

interface PaymentMethodManagerProps {
  methods: PaymentMethodConfig[];
  onChange: (updatedMethods: PaymentMethodConfig[]) => void;
}

// Suggested presets for fast one-click addition
const PRESET_PROVIDERS = [
  { name: 'GCash', type: 'wallet', defaultInstructions: 'Send via GCash Express Send or scan QR code. Save transaction screenshot.' },
  { name: 'Maya', type: 'wallet', defaultInstructions: 'Send via Maya / PayMaya to designated number or scan QR code.' },
  { name: 'MariBank', type: 'digital-bank', defaultInstructions: 'Send via SeaBank / MariBank / InstaPay. Save confirmation screenshot.' },
  { name: 'Bank Transfer (BDO / BPI / UnionBank)', type: 'bank', defaultInstructions: 'InstaPay or PESONet transfer to designated account. Keep reference number.' },
  { name: 'GoTyme Bank', type: 'digital-bank', defaultInstructions: 'Transfer via GoTyme / InstaPay to designated account.' },
  { name: 'SeaBank', type: 'digital-bank', defaultInstructions: 'Direct SeaBank or QRPh transfer.' }
];

/**
 * Optimizes uploaded QR code images (JPG, PNG, WEBP)
 */
const optimizeQrCodeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800; // QR codes only need crisp 800px max
        let { width, height } = img;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const optimized = canvas.toDataURL('image/jpeg', 0.9);
        resolve(optimized);
      };
      img.onerror = () => reject(new Error('Failed to parse QR code image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read QR file'));
    reader.readAsDataURL(file);
  });
};

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  methods,
  onChange
}) => {
  const safeMethods: PaymentMethodConfig[] = useMemo(() => {
    let list: any = methods;
    if (typeof list === 'string') {
      try { list = JSON.parse(list); } catch { list = null; }
    }
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return INITIAL_PAYMENT_METHODS;
  }, [methods]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lightboxQrUrl, setLightboxQrUrl] = useState<{ url: string; title: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAccountName, setFormAccountName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formQrCodeUrl, setFormQrCodeUrl] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [qrInputMode, setQrInputMode] = useState<'upload' | 'url'>('upload');

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('GCash');
    setFormAccountName('Mae Joey Balla');
    setFormAccountNumber('09203963249');
    setFormQrCodeUrl('');
    setFormInstructions('Send via GCash Express Send or scan QR code. Save transaction screenshot as proof.');
    setFormActive(true);
    setQrInputMode('upload');
    setShowAddModal(true);
  };

  const handleOpenEdit = (pm: PaymentMethodConfig) => {
    setEditingId(pm.id);
    setFormName(pm.name);
    setFormAccountName(pm.accountName);
    setFormAccountNumber(pm.accountNumber);
    setFormQrCodeUrl(pm.qrCodeUrl || '');
    setFormInstructions(pm.instructions || '');
    setFormActive(pm.active);
    setQrInputMode(pm.qrCodeUrl?.startsWith('data:') ? 'upload' : 'url');
    setShowAddModal(true);
  };

  const handleApplyPreset = (preset: typeof PRESET_PROVIDERS[0]) => {
    setFormName(preset.name);
    setFormInstructions(preset.defaultInstructions);
  };

  const handleQrFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid JPG, PNG, or WEBP image.');
      return;
    }

    try {
      setIsUploadingQr(true);
      const optimizedUrl = await optimizeQrCodeImage(file);
      let finalUrl = optimizedUrl;
      try {
        finalUrl = await googleSheetsApi.uploadImage(optimizedUrl, file.name, 'Payment_Qr');
      } catch {
        finalUrl = optimizedUrl;
      }
      setFormQrCodeUrl(finalUrl);
    } catch (err) {
      console.error('Error optimizing QR image:', err);
      alert('Could not process QR code image.');
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleSaveMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAccountName.trim() || !formAccountNumber.trim()) {
      alert('Please provide payment method name, account name, and account number.');
      return;
    }

    if (editingId) {
      const updated = safeMethods.map(m => {
        if (m.id === editingId) {
          return {
            ...m,
            name: formName.trim(),
            accountName: formAccountName.trim(),
            accountNumber: formAccountNumber.trim(),
            qrCodeUrl: formQrCodeUrl.trim() || undefined,
            instructions: formInstructions.trim() || undefined,
            active: formActive
          };
        }
        return m;
      });
      onChange(updated);
    } else {
      const newMethod: PaymentMethodConfig = {
        id: `pm-${Date.now()}`,
        name: formName.trim(),
        accountName: formAccountName.trim(),
        accountNumber: formAccountNumber.trim(),
        qrCodeUrl: formQrCodeUrl.trim() || undefined,
        instructions: formInstructions.trim() || undefined,
        active: formActive,
        sortOrder: safeMethods.length + 1
      };
      onChange([...safeMethods, newMethod]);
    }

    setShowAddModal(false);
  };

  const handleDeleteMethod = (id: string) => {
    if (safeMethods.length <= 1) {
      alert('You must have at least one payment method configured.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      onChange(safeMethods.filter(m => m.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = safeMethods.map(m => m.id === id ? { ...m, active: !m.active } : m);
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= safeMethods.length) return;

    const reordered = [...safeMethods];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#232f4b]">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#f472b6]" />
            <span>Dynamic Payment Methods Manager</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure dynamic payment gateways (GCash, Maya, MariBank, Banks, or Future Providers). Customers see active methods at checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-95 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Methods List */}
      <div className="space-y-3">
        {safeMethods.map((pm, idx) => (
          <div
            key={pm.id}
            className={`p-4 rounded-xl border transition-all ${
              pm.active
                ? 'bg-[#0b0f19] border-[#232f4b] hover:border-[#7c5cb7]/60'
                : 'bg-[#0b0f19]/40 border-[#232f4b]/50 opacity-70'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Left Info */}
              <div className="flex items-start gap-3">
                {/* QR Thumbnail */}
                {pm.qrCodeUrl ? (
                  <div
                    onClick={() => setLightboxQrUrl({ url: pm.qrCodeUrl!, title: `${pm.name} QR Code` })}
                    className="relative w-14 h-14 rounded-lg bg-white p-1 shrink-0 cursor-pointer group border border-[#232f4b] shadow-sm"
                    title="Click to enlarge QR code"
                  >
                    <img
                      src={pm.qrCodeUrl}
                      alt={`${pm.name} QR`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-[#131b2e] border border-[#232f4b] flex flex-col items-center justify-center text-slate-500 shrink-0">
                    <QrCode className="w-5 h-5" />
                    <span className="text-[9px] mt-0.5">No QR</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{pm.name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(pm.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        pm.active
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {pm.active ? '● Active in Checkout' : '○ Inactive / Hidden'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span>
                      Account Name: <strong className="text-white">{pm.accountName}</strong>
                    </span>
                    <span>
                      Account No: <strong className="font-mono text-[#b19cd9]">{pm.accountNumber}</strong>
                    </span>
                  </div>

                  {pm.instructions && (
                    <div className="text-[11px] text-slate-400 line-clamp-1 italic">
                      &quot;{pm.instructions}&quot;
                    </div>
                  )}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {/* Reorder Buttons */}
                <div className="flex items-center bg-[#131b2e] border border-[#232f4b] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === safeMethods.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(pm)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] text-xs font-semibold text-[#e0d7f5] flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteMethod(pm.id)}
                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition-colors"
                  title="Delete Payment Method"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT PAYMENT METHOD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-3.5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#f472b6]" />
                  <span>{editingId ? 'Edit Payment Method' : 'Add New Payment Gateway'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specify recipient details, QR code scan preview, and custom customer instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMethod} className="space-y-4 text-xs">
              {/* Quick Presets (Only on new add) */}
              {!editingId && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    Quick Presets:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PROVIDERS.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
                          formName === p.name
                            ? 'bg-[#1e1b4b] border-[#7c5cb7] text-[#f472b6]'
                            : 'bg-[#131b2e] border-[#232f4b] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method Name */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Payment Method Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. GCash, Maya, MariBank, BPI Online, UnionBank"
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              {/* Account Name & Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Account Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formAccountName}
                    onChange={e => setFormAccountName(e.target.value)}
                    placeholder="e.g. Mae Joey Balla"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Account Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formAccountNumber}
                    onChange={e => setFormAccountNumber(e.target.value)}
                    placeholder="e.g. 09203963249 or 1092-8374-2910"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white font-mono focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
              </div>

              {/* QR Code Upload / Link Section */}
              <div className="p-4 rounded-xl bg-[#131b2e]/70 border border-[#232f4b] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#f472b6]" />
                      <span>Official QR Code (JPG, PNG, WEBP)</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Folder className="w-3 h-3 text-emerald-400" />
                      <span>APMERCH_DATAFOLDER/Payment_Qr</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#0b0f19] p-0.5 rounded-lg border border-[#232f4b]">
                    <button
                      type="button"
                      onClick={() => setQrInputMode('upload')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        qrInputMode === 'upload'
                          ? 'bg-[#1e1b4b] text-[#f472b6]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrInputMode('url')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        qrInputMode === 'url'
                          ? 'bg-[#1e1b4b] text-[#f472b6]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {qrInputMode === 'upload' ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-[#232f4b] hover:border-[#7c5cb7] rounded-xl p-4 bg-[#0b0f19]/40 text-center transition-colors">
                      <label className="flex flex-col items-center justify-center cursor-pointer space-y-2">
                        <div className="w-10 h-10 rounded-full bg-[#1e1b4b] text-[#b19cd9] flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-white">
                          {isUploadingQr ? 'Optimizing QR Code...' : 'Drop QR Image or Browse (JPG, PNG, WEBP)'}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Supports direct screenshot & official QR standee exports
                        </p>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={e => handleQrFileUpload(e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formQrCodeUrl}
                      onChange={e => setFormQrCodeUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or hosted QR URL"
                      className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#7c5cb7]"
                    />
                  </div>
                )}

                {/* QR Code Live Preview Card */}
                {formQrCodeUrl && (
                  <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#232f4b] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-white p-0.5 shrink-0 border border-slate-700">
                        <img
                          src={formQrCodeUrl}
                          alt="QR Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">QR Code Attached</div>
                        <button
                          type="button"
                          onClick={() => setLightboxQrUrl({ url: formQrCodeUrl, title: `${formName} QR Preview` })}
                          className="text-[11px] text-[#f472b6] hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Eye className="w-3 h-3" /> Click to Enlarge Preview
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormQrCodeUrl('')}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded bg-rose-950/30 border border-rose-500/30"
                    >
                      Remove QR
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Customer Instructions <span className="text-slate-500">(Displayed at checkout)</span>
                </label>
                <textarea
                  rows={2}
                  value={formInstructions}
                  onChange={e => setFormInstructions(e.target.value)}
                  placeholder="e.g. Scan QR or transfer via InstaPay. Keep receipt screenshot."
                  className="w-full px-3.5 py-2 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formActive"
                  checked={formActive}
                  onChange={e => setFormActive(e.target.checked)}
                  className="rounded border-slate-700 text-[#7c5cb7]"
                />
                <label htmlFor="formActive" className="text-slate-200 font-medium cursor-pointer">
                  Enable this payment method for customer checkout
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#232f4b] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-md hover:opacity-95"
                >
                  {editingId ? 'Save Changes' : 'Add Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENLARGE QR CODE LIGHTBOX MODAL */}
      {lightboxQrUrl && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxQrUrl(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-[#0b0f19] border border-[#3b2b73] rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#f472b6]" />
                <span>{lightboxQrUrl.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxQrUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto max-w-[260px]">
              <img
                src={lightboxQrUrl.url}
                alt="QR Code Enlarge"
                className="w-full h-auto aspect-square object-contain mx-auto"
              />
            </div>

            <p className="text-xs text-slate-400">
              Scan with your banking or e-wallet app to pay.
            </p>

            <button
              type="button"
              onClick={() => setLightboxQrUrl(null)}
              className="w-full py-2.5 rounded-xl bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] text-xs font-bold text-[#e0d7f5]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
