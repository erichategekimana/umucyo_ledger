import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cooperativeService } from '@/api/cooperative.service';
import { Farmer } from '@/types';
import { ROUTES } from '@/config/routes';

export const FarmerForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<Farmer>>({
    user: '',
    cooperative: '',
    national_id: '',
    full_name: '',
    phone_number: '',
    district: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    cooperativeService.listCooperatives({ page_size: 100 })
      .then(resp => setCooperatives(resp.results))
      .catch(console.error);

    if (isEditing && id) {
      setLoading(true);
      cooperativeService.getFarmer(id)
        .then((data) => {
          setFormData(data);
        })
        .catch((err) => setError('Failed to load farmer'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEditing && id) {
        await cooperativeService.updateFarmer(id, formData);
      } else {
        await cooperativeService.createFarmer(formData);
      }
      navigate(ROUTES.FARMERS);
    } catch (err: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(err, 'Failed to save farmer.'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEditing ? 'Edit Farmer' : 'New Farmer'}
      </h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">User ID (UUID)</label>
          <input
            type="text"
            name="user"
            value={formData.user || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
          <p className="text-xs text-gray-500">UUID of existing user with role FARMER</p>
        </div>
        <div>
          <label className="block text-sm font-medium">Cooperative</label>
          <select
            name="cooperative"
            value={formData.cooperative || ''}
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
          <label className="block text-sm font-medium">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone Number</label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">National ID</label>
          <input
            type="text"
            name="national_id"
            value={formData.national_id || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">District</label>
          <input
            type="text"
            name="district"
            value={formData.district || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.FARMERS)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};