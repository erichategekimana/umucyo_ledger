import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { agronomyService } from '@/api/agronomy.service';
import { cooperativeService } from '@/api/cooperative.service';
import { ROUTES } from '@/config/routes';
import { handleApiError } from '@/utils/errorHandler';
import { AlertTriangle, MapPin, Navigation, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Helper component to handle map click events
const LocationPickerMarker = ({
  position,
  onPositionChange,
}: {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

export const AnomalyForm = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    cooperative: '',
    sector: '',
    latitude: searchParams.get('lat') || '-1.9441',
    longitude: searchParams.get('lng') || '30.0619',
    category: '',
    description: '',
    severity: 'MEDIUM',
  });

  const currentLat = parseFloat(formData.latitude) || -1.9441;
  const currentLng = parseFloat(formData.longitude) || 30.0619;
  const markerPosition: [number, number] = [currentLat, currentLng];

  useEffect(() => {
    // Fetch cooperatives list (try listCooperatives first, fallback to getApprovedCooperatives)
    cooperativeService
      .listCooperatives({ page_size: 100 })
      .then((resp) => {
        if (resp.results && resp.results.length > 0) {
          setCooperatives(resp.results.map((c) => ({ id: c.id, name: c.name })));
        } else {
          return cooperativeService.getApprovedCooperatives().then((approved) => {
            setCooperatives(approved.map((c) => ({ id: c.id, name: c.name })));
          });
        }
      })
      .catch(() => {
        cooperativeService
          .getApprovedCooperatives()
          .then((approved) => setCooperatives(approved.map((c) => ({ id: c.id, name: c.name }))))
          .catch(console.error);
      });

    // If editing, load anomaly details
    if (isEditing && id) {
      setFetching(true);
      agronomyService
        .getAnomaly(id)
        .then((data) => {
          setFormData({
            cooperative: data.cooperative,
            sector: data.sector || '',
            latitude: data.latitude?.toString() || '-1.9441',
            longitude: data.longitude?.toString() || '30.0619',
            category: data.category || '',
            description: data.description || '',
            severity: data.severity || 'MEDIUM',
          });
        })
        .catch((err) => setError(handleApiError(err, 'Failed to load anomaly details.')))
        .finally(() => setFetching(false));
    }
  }, [id, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMapClick = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setSuccess('Location updated to your current GPS position!');
        setTimeout(() => setSuccess(''), 3000);
      },
      (err) => {
        setError('Failed to retrieve your GPS location. Please check browser permissions.');
      }
    );
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
      setError(handleApiError(err, 'Failed to save anomaly report.'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Loading report details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.ANOMALIES}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit Anomaly Report' : 'Report New Health Anomaly'}
            </h1>
            <p className="text-sm text-slate-500">
              Log disease outbreaks, pest infestations, or veterinary concerns with precise GIS mapping.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Details (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <AlertTriangle size={20} className="text-emerald-600" /> Anomaly Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Cooperative *
              </label>
              <select
                name="cooperative"
                value={formData.cooperative}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="">-- Select Cooperative --</option>
                {cooperatives.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category / Name *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Foot-and-Mouth Disease, Coffee Wilt"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sector / Region
                </label>
                <input
                  type="text"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  placeholder="e.g. Nyarugenge, Kinigi"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Severity Level *
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold"
              >
                <option value="LOW">Low (Minor Advisory)</option>
                <option value="MEDIUM">Medium (Requires Monitoring)</option>
                <option value="HIGH">High (Action Needed)</option>
                <option value="CRITICAL">Critical (Quarantine / Urgent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Detailed Description & Recommendations
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Provide clinical observations, symptoms, affected livestock/crops, and immediate actions..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* GIS Map Location Picker (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={20} className="text-emerald-600" /> Map Location Picker
              </h2>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all flex items-center gap-1"
                title="Detect GPS Location"
              >
                <Navigation size={12} /> GPS
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Click anywhere on the map to pin the exact position of the health anomaly.
            </p>

            {/* Map Box */}
            <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
              <MapContainer
                center={markerPosition}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationPickerMarker
                  position={markerPosition}
                  onPositionChange={handleMapClick}
                />
              </MapContainer>
            </div>

            {/* Manual Lat / Lng inputs */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <Save size={18} /> {isEditing ? 'Update Report' : 'Save Anomaly Report'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.ANOMALIES)}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};