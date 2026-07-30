import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '@/api/sales.service';
import { cooperativeService } from '@/api/cooperative.service';
import { harvestService } from '@/api/harvest.service';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

export const SaleForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: string; crop_type: string; total_weight_kg: number }[]>([]);

  const [formData, setFormData] = useState({
    cooperative: '',
    batch: '',
    buyer: '',
    price_per_kg: '',
    sale_date: new Date().toISOString().slice(0, 16), // datetime-local format
    status: 'PENDING',
  });

  // Auto-fill cooperative if user is Manager (they belong to one)
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Load cooperatives for selection
        const coopResp = await cooperativeService.listCooperatives({ page_size: 100 });
        setCooperatives(coopResp.results.map(c => ({ id: c.id, name: c.name })));

        // If user is Manager, we might want to auto-select their cooperative?
        // We need to get the manager's cooperative from their staff profile.
        // For simplicity, we'll let the user select.
      } catch (error) {
        console.error('Failed to load options', error);
      }
    };
    loadOptions();
  }, []);

  // When cooperative changes, load its open batches
  useEffect(() => {
    if (formData.cooperative) {
      harvestService.listBatches({ cooperative: formData.cooperative, status: 'OPEN', page_size: 100 })
        .then(resp => {
          setBatches(resp.results.map(b => ({ id: b.id, crop_type: b.crop_type, total_weight_kg: b.total_weight_kg })));
        })
        .catch(console.error);
    } else {
      setBatches([]);
    }
  }, [formData.cooperative]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await salesService.createSale({
        cooperative: formData.cooperative,
        batch: formData.batch,
        buyer: formData.buyer,
        price_per_kg: parseFloat(formData.price_per_kg),
        sale_date: formData.sale_date,
        status: formData.status,
      });
      navigate(ROUTES.SALES);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New Bulk Sale</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Cooperative</label>
          <select
            name="cooperative"
            value={formData.cooperative}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Select cooperative</option>
            {cooperatives.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Batch (OPEN)</label>
          <select
            name="batch"
            value={formData.batch}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Select batch</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.crop_type} (Weight: {b.total_weight_kg}kg)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Buyer</label>
          <input
            type="text"
            name="buyer"
            value={formData.buyer}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Price per kg (RWF)</label>
          <input
            type="number"
            name="price_per_kg"
            value={formData.price_per_kg}
            onChange={handleChange}
            required
            min="0.01"
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Sale Date</label>
          <input
            type="datetime-local"
            name="sale_date"
            value={formData.sale_date}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Sale'}
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.SALES)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};