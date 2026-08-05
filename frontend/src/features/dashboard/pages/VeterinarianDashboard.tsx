import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { agronomyService } from '@/api/agronomy.service';
import { AnomalyReport } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/config/routes';
import {
  AlertTriangle,
  CheckCircle,
  Map as MapIcon,
  Plus,
  Edit,
  Tags,
  MapPin,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const severityBadge = (severity: string) => {
  const map: Record<string, string> = {
    LOW: 'bg-blue-100 text-blue-800 border-blue-200',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200 font-bold',
  };
  return (
    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${map[severity] || 'bg-slate-100 text-slate-700'}`}>
      {severity}
    </span>
  );
};

export const VeterinarianDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<AnomalyReport[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const resp = await agronomyService.listAnomalies({ ordering: '-created_at', page_size: 100 });
      setReports(resp.results);
    } catch (error) {
      console.error('Failed to fetch anomaly reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (id: string) => {
    if (!window.confirm('Mark this anomaly as resolved?')) return;
    setResolvingId(id);
    try {
      await agronomyService.resolveAnomaly(id);
      await fetchReports();
    } catch (error) {
      alert('Failed to resolve anomaly.');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Veterinarian Workspace..." />;

  const unresolved = reports.filter((r) => !r.resolved);
  const critical = reports.filter((r) => !r.resolved && (r.severity === 'CRITICAL' || r.severity === 'HIGH'));
  const resolved = reports.filter((r) => r.resolved);

  const filteredReports = reports.filter((r) => {
    if (filterTab === 'OPEN' && r.resolved) return false;
    if (filterTab === 'RESOLVED' && !r.resolved) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.category.toLowerCase().includes(q) ||
        r.sector.toLowerCase().includes(q) ||
        (r.cooperative_name && r.cooperative_name.toLowerCase().includes(q)) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getMarkerColor = (severity: string, isResolved: boolean) => {
    if (isResolved) return '#10b981';
    switch (severity) {
      case 'LOW':
        return '#3b82f6';
      case 'MEDIUM':
        return '#eab308';
      case 'HIGH':
        return '#f97316';
      case 'CRITICAL':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Veterinarian & Extension Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time agricultural health tracking, disease outbreak monitoring, and GIS response.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={ROUTES.CROP_PRICES}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 border border-slate-200"
          >
            <Tags size={16} /> Market Prices
          </Link>
          <Link
            to={ROUTES.ANOMALY_MAP}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 border border-blue-200"
          >
            <MapIcon size={16} /> Full GIS Map
          </Link>
          <Link
            to={ROUTES.ANOMALY_NEW}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Report Anomaly
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Unresolved Anomalies"
          value={unresolved.length}
          subtitle="Requiring immediate action"
          icon={<AlertTriangle size={22} />}
          color="red"
        />
        <StatCard
          title="Critical / High Severity"
          value={critical.length}
          subtitle="Urgent health threats"
          icon={<AlertTriangle size={22} />}
          color="amber"
        />
        <StatCard
          title="Resolved Anomalies"
          value={resolved.length}
          subtitle="Successfully contained"
          icon={<CheckCircle size={22} />}
          color="emerald"
        />
        <StatCard
          title="Total Reports Logged"
          value={reports.length}
          subtitle="Historical monitoring records"
          icon={<MapPin size={22} />}
          color="blue"
        />
      </div>

      {/* Interactive GIS Health Map Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <MapIcon size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Live GIS Health Map</h2>
              <p className="text-xs text-slate-500">Interactive outbreak monitoring across sectors</p>
            </div>
          </div>
          <Link
            to={ROUTES.ANOMALY_MAP}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Expand Map <MapIcon size={12} />
          </Link>
        </div>

        <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-200 relative">
          <MapContainer center={[-1.9441, 30.0619]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {reports
              .filter((r) => r.latitude && r.longitude)
              .map((r) => (
                <Marker
                  key={r.id}
                  position={[r.latitude, r.longitude]}
                  icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `
                      <div style="
                        background-color: ${getMarkerColor(r.severity, r.resolved)};
                        color: white;
                        padding: 3px 6px;
                        border-radius: 12px;
                        font-size: 10px;
                        font-weight: 800;
                        border: 2px solid white;
                        white-space: nowrap;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                      ">
                        ${r.category}
                      </div>
                    `,
                    iconSize: [80, 24],
                    iconAnchor: [40, 12],
                  })}
                >
                  <Popup>
                    <div className="p-1 space-y-1.5 min-w-[200px]">
                      <div className="font-bold text-sm text-slate-900">{r.category}</div>
                      <div className="text-xs text-slate-500">{r.description}</div>
                      <div className="text-[11px] font-semibold text-slate-700">
                        Sector: {r.sector || 'N/A'} | Status: {r.resolved ? 'Resolved' : r.severity}
                      </div>
                      <div className="pt-1 flex gap-2">
                        <Link
                          to={ROUTES.ANOMALY_EDIT(r.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>

      {/* Reports Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['OPEN', 'RESOLVED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'OPEN' ? 'Open Alerts' : tab === 'RESOLVED' ? 'Resolved' : 'All Reports'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search category, sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 w-48 sm:w-64"
              />
            </div>
            <button
              onClick={fetchReports}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
              title="Reload table"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-50/50">
                <th className="py-3 px-4 font-semibold">Category / Name</th>
                <th className="py-3 px-4 font-semibold">Cooperative</th>
                <th className="py-3 px-4 font-semibold">Sector</th>
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Coordinates</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No health anomaly reports found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{row.category}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{row.cooperative_name || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">{row.sector || '—'}</td>
                    <td className="py-3 px-4">{severityBadge(row.severity)}</td>
                    <td className="py-3 px-4">
                      {row.resolved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle size={12} /> Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                          <AlertTriangle size={12} /> Open
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {row.latitude ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!row.resolved && (
                          <button
                            onClick={() => handleResolve(row.id)}
                            disabled={resolvingId === row.id}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1 disabled:opacity-40"
                          >
                            <CheckCircle size={12} /> Resolve
                          </button>
                        )}
                        <Link
                          to={ROUTES.ANOMALY_EDIT(row.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                        >
                          <Edit size={12} /> Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};