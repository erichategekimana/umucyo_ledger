import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { harvestService } from '@/api/harvest.service';
import { cooperativeService } from '@/api/cooperative.service';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

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
    // Load farmers and cooperatives for dropdowns
    const fetchOptions = async () => {
      try {
        const [farmersResp, coopResp] = await Promise.all([
          cooperativeService.listFarmers({ page_size: 200 }),
          cooperativeService.listCooperatives({ page_size: 100 }),
        ]);
        setFarmers(farmersResp.results.map(f => ({ id: f.id, full_name: f.full_name })));
        setCooperatives(coopResp.results.map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error('Failed to load options', error);
      }
    };
    fetchOptions();
  }, []);

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
      setError(err.response?.data?.detail || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New Delivery</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Farmer</label>
          <select
            name="farmer"
            value={formData.farmer}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Select farmer</option>
            {farmers.map(f => (
              <option key={f.id} value={f.id}>{f.full_name}</option>
            ))}
          </select>
        </div>
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
          <label className="block text-sm font-medium">Crop Type</label>
          <input
            type="text"
            name="crop_type"
            value={formData.crop_type}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Weight (kg)</label>
          <input
            type="number"
            name="weight_kg"
            value={formData.weight_kg}
            onChange={handleChange}
            required
            min="0.1"
            step="0.1"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.DELIVERIES)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};