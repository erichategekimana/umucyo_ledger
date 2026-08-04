import { useEffect, useState } from 'react';
import { harvestService } from '@/api/harvest.service';
import { CropPrice } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Tags, Save, Plus, AlertCircle, CheckCircle2, DollarSign, ShieldAlert, Sparkles } from 'lucide-react';
import { handleApiError } from '@/utils/errorHandler';

export const CropPricesPage = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New crop modal / inline state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newCropPrice, setNewCropPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await harvestService.listCropPrices();
      setPrices(data);
      const initialMap: Record<string, number> = {};
      data.forEach((item) => {
        initialMap[item.id] = Number(item.price_per_kg);
      });
      setEditedPrices(initialMap);
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch crop prices.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const handlePriceChange = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setEditedPrices((prev) => ({ ...prev, [id]: num }));
  };

  const handleSaveSingle = async (crop: CropPrice) => {
    const newPrice = editedPrices[crop.id];
    if (newPrice === undefined || newPrice < 0) {
      setError('Price per 1kg must be a positive number.');
      return;
    }

    setSavingId(crop.id);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await harvestService.updateCropPrice(crop.id, newPrice);
      setPrices((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSuccessMsg(`Successfully updated price for ${crop.name} to ${newPrice.toLocaleString()} RWF/kg.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(handleApiError(err, `Failed to update price for ${crop.name}.`));
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkSave = async () => {
    setIsBulkSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = prices.map((p) => ({
        id: p.id,
        name: p.name,
        price_per_kg: editedPrices[p.id] ?? Number(p.price_per_kg),
      }));
      const updatedList = await harvestService.bulkUpdateCropPrices(payload);
      setPrices(updatedList);
      setSuccessMsg('All national crop prices per 1kg updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(handleApiError(err, 'Failed to bulk update crop prices.'));
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCropName.trim() || !newCropPrice) {
      setError('Please provide a crop name and price per 1kg.');
      return;
    }
    const numPrice = parseFloat(newCropPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Price per 1kg must be a positive number.');
      return;
    }

    setIsAdding(true);
    setError('');
    setSuccessMsg('');
    try {
      const created = await harvestService.createCropPrice(newCropName.trim(), numPrice);
      setPrices((prev) => [...prev, created]);
      setEditedPrices((prev) => ({ ...prev, [created.id]: numPrice }));
      setNewCropName('');
      setNewCropPrice('');
      setShowAddModal(false);
      setSuccessMsg(`Added ${created.name} at ${numPrice.toLocaleString()} RWF/kg.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(handleApiError(err, 'Failed to add new crop price.'));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">National Crop Prices</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={12} /> Per 1 kg (RWF)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Super Admin sets standard national prices per 1kg. These prices determine farmer delivery earnings and payout calculations platform-wide.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all flex items-center gap-2 border border-slate-200"
            >
              <Plus size={16} /> Add New Crop
            </button>
            <button
              onClick={handleBulkSave}
              disabled={isBulkSaving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isBulkSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving All...
                </span>
              ) : (
                <>
                  <Save size={16} /> Save All Prices
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Notice Banner */}
      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3 text-sm">
          <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span className="font-bold">Read-Only View:</span> Crop prices per 1kg are regulated centrally by RCA Super Admin. These rates are automatically applied to your cooperative's harvest drop-offs and farmer payout statements.
          </div>
        </div>
      )}

      {/* Success / Error Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 bg-slate-100 animate-pulse rounded-2xl border border-slate-200 p-5" />
          ))}
        </div>
      ) : (
        /* Crop Price Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prices.map((crop) => {
            const currentEditVal = editedPrices[crop.id] ?? crop.price_per_kg;
            const isModified = Number(currentEditVal) !== Number(crop.price_per_kg);

            return (
              <div
                key={crop.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isModified ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                        <Tags size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{crop.name}</h3>
                        <p className="text-xs text-slate-400">National Standard Rate</p>
                      </div>
                    </div>
                    {isModified && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                        Unsaved
                      </span>
                    )}
                  </div>

                  {/* Price Input / Display */}
                  <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Price per 1 kg (RWF)
                    </label>
                    {isSuperAdmin ? (
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                          RWF
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={currentEditVal}
                          onChange={(e) => handlePriceChange(crop.id, e.target.value)}
                          className="w-full pl-14 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-emerald-700">
                          {Number(crop.price_per_kg).toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">RWF / kg</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer / Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Updated: {new Date(crop.updated_at).toLocaleDateString()}
                  </span>

                  {isSuperAdmin && (
                    <button
                      onClick={() => handleSaveSingle(crop)}
                      disabled={savingId === crop.id || !isModified}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {savingId === crop.id ? (
                        <span className="flex items-center gap-1">Saving...</span>
                      ) : (
                        <>
                          <Save size={14} /> Update
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Crop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-600" /> Add New Crop & Price
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCrop} className="space-y-4">
              <div className="form-group">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  Crop Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCropName}
                  onChange={(e) => setNewCropName(e.target.value)}
                  placeholder="e.g. Soybeans"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  Price per 1 kg (RWF) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.1"
                  value={newCropPrice}
                  onChange={(e) => setNewCropPrice(e.target.value)}
                  placeholder="e.g. 750"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-200 disabled:opacity-60"
                >
                  {isAdding ? 'Adding...' : 'Save Crop Price'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
