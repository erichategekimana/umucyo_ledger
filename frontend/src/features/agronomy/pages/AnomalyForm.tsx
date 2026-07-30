import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { agronomyService } from '@/api/agronomy.service';
import { cooperativeService } from '@/api/cooperative.service';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

export const AnomalyForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    cooperative: '',
    sector: '',
    latitude: '',
    longitude: '',
    category: '',
    description: '',
    severity: 'MEDIUM',
  });

  useEffect(() => {
    // Load cooperatives for dropdown
    cooperativeService.listCooperatives({ page_size: 100 })
      .then(resp => setCooperatives(resp.results.map(c => ({ id: c.id, name: c.name }))))
      .catch(console.error);

    if (isEditing && id) {
      setLoading(true);
      agronomyService.getAnomaly(id)  // we need to add this method if not exists
        .then(data => {
          setFormData({
            cooperative: data.cooperative,
            sector: data.sector || '',
            latitude: data.latitude?.toString() || '',
            longitude: data.longitude?.toString() || '',
            category: data.category || '',
            description: data.description || '',
            severity: data.severity || 'MEDIUM',
          });
        })
        .catch(err => setError('Failed to load anomaly'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
      };
      if (isEditing && id) {
        await agronomyService.updateAnomaly(id, payload);
      } else {
        await agronomyService.createAnomaly(payload);
      }
      navigate(ROUTES.ANOMALIES);
    } catch (err: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(err, 'Failed to save anomaly.'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEditing ? 'Edit Anomaly Report' : 'New Anomaly Report'}
      </h1>
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
          <label className="block text-sm font-medium">Sector</label>
          <input
            type="text"
            name="sector"
            value={formData.sector}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Latitude</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Longitude</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Severity</label>
          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
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
            onClick={() => navigate(ROUTES.ANOMALIES)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};