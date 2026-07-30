import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cooperativeService } from '@/api/cooperative.service';
import { Cooperative } from '@/types';
import { ROUTES } from '@/config/routes';

export const CooperativeForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<Cooperative>>({
    name: '',
    rca_registration_no: '',
    sector: '',
    district: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      cooperativeService.getCooperative(id)
        .then((data) => {
          setFormData(data);
        })
        .catch((err) => setError('Failed to load cooperative'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEditing && id) {
        await cooperativeService.updateCooperative(id, formData);
      } else {
        await cooperativeService.createCooperative(formData);
      }
      navigate(ROUTES.COOPERATIVES);
    } catch (err: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(err, 'Failed to save cooperative.'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEditing ? 'Edit Cooperative' : 'New Cooperative'}
      </h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">RCA Registration No</label>
          <input
            type="text"
            name="rca_registration_no"
            value={formData.rca_registration_no || ''}
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
        <div>
          <label className="block text-sm font-medium">Sector</label>
          <input
            type="text"
            name="sector"
            value={formData.sector || ''}
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
            onClick={() => navigate(ROUTES.COOPERATIVES)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};