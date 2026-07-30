import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cooperativeService } from '@/api/cooperative.service';
import { CooperativeStaff } from '@/types';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

export const StaffForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    user: '',
    cooperative: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);

  // For creating, we may need to select a user (but we might not have a user picker; we'll need to link to existing user)
  // Actually the backend expects user (UUID) and cooperative (UUID). We'll need a way to select user.
  // For simplicity, we'll just create a form that takes user ID and cooperative ID.
  // But in reality, we'd have a dropdown of available users.
  // For now, we'll use text inputs.

  useEffect(() => {
    // Fetch cooperatives for dropdown
    cooperativeService.listCooperatives({ page_size: 100 })
      .then(resp => setCooperatives(resp.results))
      .catch(console.error);

    if (isEditing && id) {
      setLoading(true);
      cooperativeService.getStaff(id)
        .then((data) => {
          setFormData({
            user: data.user,
            cooperative: data.cooperative,
            is_active: data.is_active,
          });
        })
        .catch((err) => setError('Failed to load staff'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEditing && id) {
        await cooperativeService.updateStaff(id, formData);
      } else {
        await cooperativeService.createStaff(formData);
      }
      navigate(ROUTES.STAFF);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save staff');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEditing ? 'Edit Staff' : 'New Staff'}
      </h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">User ID (UUID)</label>
          <input
            type="text"
            name="user"
            value={formData.user}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
          <p className="text-xs text-gray-500">Enter the UUID of an existing user</p>
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
        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">Active</label>
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
            onClick={() => navigate(ROUTES.STAFF)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};