import { useEffect, useState } from 'react';
import { agronomyService } from '@/api/agronomy.service';
import { AnomalyReport } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const VeterinarianDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<AnomalyReport[]>([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await agronomyService.listAnomalies({ ordering: '-created_at', page_size: 10 });
        setReports(resp.results);
        setUnresolvedCount(resp.results.filter(r => !r.resolved).length);
      } catch (error) {
        console.error('Failed to fetch anomaly reports', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activities = reports.map(r => ({
    id: r.id,
    title: `${r.category} - ${r.severity}`,
    description: r.description.slice(0, 50) + (r.description.length > 50 ? '...' : ''),
    timestamp: r.created_at,
  }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Veterinarian Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Unresolved Anomalies" value={unresolvedCount} />
        <StatCard title="Total Reports" value={reports.length} />
      </div>
      <ActivityFeed activities={activities} title="Recent Anomaly Reports" />
    </div>
  );
};