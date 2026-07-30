import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { agronomyService } from '@/api/agronomy.service';
import { AnomalyReport } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertTriangle, CheckCircle, Map, Plus, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/config/routes';

const severityBadge = (s: string) => {
  const map: Record<string, string> = {
    LOW: 'badge-green',
    MEDIUM: 'badge-yellow',
    HIGH: 'badge-orange',
    CRITICAL: 'badge-red',
  };
  return <span className={map[s] || 'badge-gray'}>{s}</span>;
};

export const VeterinarianDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<AnomalyReport[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await agronomyService.listAnomalies({ ordering: '-created_at', page_size: 10 });
        setReports(resp.results);
      } catch (error) {
        console.error('Failed to fetch anomaly reports', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const unresolved = reports.filter((r) => !r.resolved).length;
  const critical = reports.filter((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH').length;

  const activities = reports.map((r) => ({
    id: r.id,
    icon: <AlertTriangle size={16} />,
    title: `${r.category} — ${r.sector}`,
    description: r.description.slice(0, 60) + (r.description.length > 60 ? '…' : ''),
    timestamp: r.created_at,
    badge: severityBadge(r.severity),
  }));

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Veterinarian Dashboard</h1>
          <p className="page-subtitle">Agricultural health monitoring & anomaly response</p>
        </div>
        <Link to={ROUTES.ANOMALY_NEW} className="btn-primary">
          <Plus size={16} /> New Report
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Unresolved Anomalies"
          value={unresolved}
          subtitle="Requiring attention"
          icon={<AlertTriangle size={22} />}
          color="red"
        />
        <StatCard
          title="High / Critical"
          value={critical}
          subtitle="High severity alerts"
          icon={<AlertTriangle size={22} />}
          color="amber"
        />
        <StatCard
          title="Total Reports"
          value={reports.length}
          subtitle="All time records"
          icon={<CheckCircle size={22} />}
          color="emerald"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to={ROUTES.ANOMALIES}
          className="content-card flex items-center gap-4 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="stat-card-icon bg-red-100 text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Anomaly Reports</p>
            <p className="text-xs text-slate-500">Browse and manage all field reports</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-600 transition-colors" />
        </Link>

        <Link
          to={ROUTES.ANOMALY_MAP}
          className="content-card flex items-center gap-4 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="stat-card-icon bg-blue-100 text-blue-600">
            <Map size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">GIS Map View</p>
            <p className="text-xs text-slate-500">Visualize anomalies on map</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-600 transition-colors" />
        </Link>
      </div>

      <ActivityFeed activities={activities} title="Recent Anomaly Reports" maxItems={5} />
    </div>
  );
};