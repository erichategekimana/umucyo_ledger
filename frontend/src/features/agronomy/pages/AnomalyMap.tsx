import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { agronomyService } from '@/api/agronomy.service';
import { AnomalyReport } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Plus, Edit, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

// Fix default icon issue with Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Helper functions for safe number parsing & formatting (prevents toFixed runtime crashes)
const parseCoord = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? null : num;
};

const formatCoord = (val: any): string => {
  const num = parseCoord(val);
  return num !== null ? num.toFixed(4) : '—';
};

// Map Click Listener component for creating new anomaly at clicked point
const MapClickListener = ({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const AnomalyMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Selected map location state for new report creation
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  const canManage = ['VETERINARIAN', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const resp: any = await agronomyService.listAnomalies({ page_size: 150 });
      const items = Array.isArray(resp) ? resp : (resp?.results || []);
      setAnomalies(items);
    } catch (err) {
      console.error('Failed to load map data', err);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleResolve = async (id: string) => {
    if (!window.confirm('Mark this health anomaly as resolved?')) return;
    setResolvingId(id);
    try {
      await agronomyService.resolveAnomaly(id);
      await fetchAnomalies();
    } catch (err) {
      alert('Failed to resolve anomaly.');
    } finally {
      setResolvingId(null);
    }
  };

  const safeAnomalies = Array.isArray(anomalies) ? anomalies : [];

  const filteredData = safeAnomalies.filter((a) => {
    const lat = parseCoord(a.latitude);
    const lng = parseCoord(a.longitude);
    if (lat === null || lng === null) return false;
    if (statusFilter === 'OPEN') return !a.resolved;
    if (statusFilter === 'RESOLVED') return a.resolved;
    return true;
  });

  const getMarkerColor = (severity: string, resolved: boolean) => {
    if (resolved) return '#10b981'; // emerald-500
    switch (severity) {
      case 'LOW':
        return '#3b82f6'; // blue-500
      case 'MEDIUM':
        return '#eab308'; // yellow-500
      case 'HIGH':
        return '#f97316'; // orange-500
      case 'CRITICAL':
        return '#ef4444'; // red-500
      default:
        return '#64748b'; // slate-500
    }
  };

  if (loading) return <LoadingSpinner message="Loading GIS Map data..." />;

  const unresolvedCount = safeAnomalies.filter((a) => !a.resolved).length;
  const criticalCount = safeAnomalies.filter((a) => !a.resolved && (a.severity === 'CRITICAL' || a.severity === 'HIGH')).length;

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">GIS Anomaly Health Map</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <MapPin size={12} /> Interactive
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Click anywhere on the map to mark a new anomaly or click existing pins to inspect and edit reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnomalies}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Refresh map"
          >
            <RefreshCw size={16} />
          </button>

          {canManage && (
            <Link
              to={ROUTES.ANOMALY_NEW}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> New Anomaly Report
            </Link>
          )}
        </div>
      </div>

      {/* Metrics & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Critical Alerts</p>
            <p className="text-lg font-extrabold text-slate-900">{criticalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Open</p>
            <p className="text-lg font-extrabold text-slate-900">{unresolvedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Logged</p>
            <p className="text-lg font-extrabold text-slate-900">{safeAnomalies.length}</p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-1">
          {(['ALL', 'OPEN', 'RESOLVED'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setStatusFilter(mode)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                statusFilter === mode
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <MapContainer
          center={[-1.9441, 30.0619]}
          zoom={9}
          style={{ height: '620px', width: '100%', borderRadius: '1rem' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Map click handler */}
          <MapClickListener
            onMapClick={(lat, lng) => setSelectedPoint({ lat, lng })}
          />

          {/* Selected Point Marker (for instant creation) */}
          {selectedPoint && (
            <Marker position={[selectedPoint.lat, selectedPoint.lng]}>
              <Popup>
                <div className="space-y-2 p-1 min-w-[200px]">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <MapPin size={16} className="text-emerald-600" /> Selected Location
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Lat: {selectedPoint.lat.toFixed(5)}, Lng: {selectedPoint.lng.toFixed(5)}
                  </p>
                  <button
                    onClick={() =>
                      navigate(`${ROUTES.ANOMALY_NEW}?lat=${selectedPoint.lat.toFixed(6)}&lng=${selectedPoint.lng.toFixed(6)}`)
                    }
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus size={14} /> Report Anomaly Here
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Render Existing Anomalies */}
          {filteredData.map((a) => {
            const lat = parseCoord(a.latitude)!;
            const lng = parseCoord(a.longitude)!;
            const color = getMarkerColor(a.severity, a.resolved);
            return (
              <Marker
                key={a.id}
                position={[lat, lng]}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div style="
                      background-color: ${color};
                      color: white;
                      padding: 4px 8px;
                      border-radius: 20px;
                      font-size: 11px;
                      font-weight: 800;
                      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                      border: 2px solid white;
                      white-space: nowrap;
                      display: flex;
                      align-items: center;
                      gap: 4px;
                    ">
                      <span>${a.category}</span>
                    </div>
                  `,
                  iconSize: [100, 30],
                  iconAnchor: [50, 15],
                })}
              >
                <Popup>
                  <div className="space-y-2.5 p-1 min-w-[240px]">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">{a.category}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          a.resolved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {a.resolved ? 'Resolved' : a.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>

                    <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                      <div>Cooperative: <span className="text-slate-800 font-bold">{a.cooperative_name || 'N/A'}</span></div>
                      <div>Sector: <span className="text-slate-800 font-bold">{a.sector || 'N/A'}</span></div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {formatCoord(a.latitude)}, {formatCoord(a.longitude)}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-2 pt-1 border-t">
                        {!a.resolved && (
                          <button
                            onClick={() => handleResolve(a.id)}
                            disabled={resolvingId === a.id}
                            className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <CheckCircle size={12} /> Resolve
                          </button>
                        )}
                        <Link
                          to={ROUTES.ANOMALY_EDIT(a.id)}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <Edit size={12} /> Edit
                        </Link>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};