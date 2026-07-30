import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { harvestService } from '@/api/harvest.service';
import { cooperativeService } from '@/api/cooperative.service';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';

export const DeliveryForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [farmers, setFarmers] = useState<{ id: string; full_name: string }[]>([]);
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    farmer: '',
    cooperative: '',
    crop_type: '',
    weight_kg: '',
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        if (user?.role === 'FARMER') {
          const farmersResp = await cooperativeService.listFarmers({ user: user.id, page_size: 1 });
          if (farmersResp.results.length > 0) {
            const f = farmersResp.results[0];
            setFormData(prev => ({
              ...prev,
              farmer: f.id,
              cooperative: f.cooperative
            }));
          }
        } else {
          const [farmersResp, coopResp] = await Promise.all([
            cooperativeService.listFarmers({ page_size: 200 }),
            cooperativeService.listCooperatives({ page_size: 100 }),
          ]);
          setFarmers(farmersResp.results.map((f) => ({ id: f.id, full_name: f.full_name })));
          setCooperatives(coopResp.results.map((c) => ({ id: c.id, name: c.name })));
        }
      } catch (error) {
        console.error('Failed to load options', error);
      }
    };
    fetchOptions();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await harvestService.createDelivery({
        farmer: formData.farmer,
        cooperative: formData.cooperative,
        crop_type: formData.crop_type,
        weight_kg: parseFloat(formData.weight_kg),
      });
      navigate(ROUTES.DELIVERIES);
    } catch (err: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(err, 'Failed to create delivery.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Log New Delivery</h1>
          <p className="page-subtitle">Record a farmer's crop drop-off at the collection point</p>
        </div>
        <button onClick={() => navigate(ROUTES.DELIVERIES)} className="btn-ghost">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="content-card p-6">
        {error && (
          <div className="alert-error mb-5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {user?.role !== 'FARMER' && (
            <div className="form-group">
              <label className="form-label">Farmer *</label>
              <select
                name="farmer"
                value={formData.farmer}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Select farmer...</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>{f.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {user?.role !== 'FARMER' && (
            <div className="form-group">
              <label className="form-label">Cooperative *</label>
              <select
                name="cooperative"
                value={formData.cooperative}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Select cooperative...</option>
                {cooperatives.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Crop Type *</label>
            <select
              name="crop_type"
              value={formData.crop_type}
              onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
              required
              className="form-select"
            >
              <option value="">Select crop type...</option>
              {['Coffee', 'Tea', 'Pyrethrum', 'Maize', 'Beans', 'Sorghum', 'Other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Weight (kg) *</label>
            <input
              type="number"
              name="weight_kg"
              value={formData.weight_kg}
              onChange={handleChange}
              required
              min="0.1"
              step="0.1"
              placeholder="e.g. 125.5"
              className="form-input"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating...
                </span>
              ) : (
                <><Send size={16} /> Create Delivery</>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.DELIVERIES)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};