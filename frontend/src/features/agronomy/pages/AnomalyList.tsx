import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { agronomyService } from '@/api/agronomy.service';
import { AnomalyReport } from '@/types';
import { Table } from '@/components/common/Table';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const AnomalyList = () => {
  const { user } = useAuth();
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resolving, setResolving] = useState<string | null>(null);

  // Filters
  const [resolvedFilter, setResolvedFilter] = useState<boolean | undefined>(undefined);
  const [severityFilter, setSeverityFilter] = useState('');

  const canCreate = ['VETERINARIAN', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');
  const canResolve = ['VETERINARIAN', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, ordering: '-created_at' };
      if (resolvedFilter !== undefined) params.resolved = resolvedFilter;
      if (severityFilter) params.severity = severityFilter;

      const resp = await agronomyService.listAnomalies(params);
      setAnomalies(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch anomalies', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page, resolvedFilter, severityFilter]);

  const handleResolve = async (id: string) => {
    if (!window.confirm('Mark this anomaly as resolved?')) return;
    setResolving(id);
    try {
      await agronomyService.resolveAnomaly(id);
      await fetchData(page);
    } catch (error) {
      console.error('Failed to resolve anomaly', error);
      alert('Failed to resolve anomaly.');
    } finally {
      setResolving(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { header: 'Cooperative', accessor: 'cooperative_name' as keyof AnomalyReport },
    { header: 'Category', accessor: 'category' as keyof AnomalyReport },
    { header: 'Description', accessor: (row: AnomalyReport) => row.description.slice(0, 50) + (row.description.length > 50 ? '...' : '') },
    { header: 'Severity', accessor: (row: AnomalyReport) => (
      <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(row.severity)}`}>
        {row.severity}
      </span>
    )},
    { header: 'Sector', accessor: 'sector' as keyof AnomalyReport },
    { header: 'Status', accessor: (row: AnomalyReport) => row.resolved ? 'Resolved' : 'Open' },
    { header: 'Reported', accessor: (row: AnomalyReport) => new Date(row.created_at).toLocaleDateString() },
    {
      header: 'Actions',
      accessor: (row: AnomalyReport) => (
        <div className="flex space-x-2">
          {canResolve && !row.resolved && (
            <button
              onClick={() => handleResolve(row.id)}
              disabled={resolving === row.id}
              className="text-green-600 hover:text-green-900 disabled:opacity-50"
            >
              {resolving === row.id ? '...' : 'Resolve'}
            </button>
          )}
          {canCreate && (
            <Link
              to={ROUTES.ANOMALY_EDIT(row.id)}
              className="text-indigo-600 hover:text-indigo-900"
            >
              Edit
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Anomaly Reports</h1>
        <div className="flex items-center space-x-4">
          {canCreate && (
            <Link
              to={ROUTES.ANOMALY_NEW}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              New Report
            </Link>
          )}
          <Link
            to={ROUTES.ANOMALY_MAP}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Map View
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            value={resolvedFilter === undefined ? '' : resolvedFilter.toString()}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') setResolvedFilter(undefined);
              else setResolvedFilter(val === 'true');
            }}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">All</option>
            <option value="false">Open</option>
            <option value="true">Resolved</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">All</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setResolvedFilter(undefined); setSeverityFilter(''); }}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <Table
        data={anomalies}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No anomaly reports found"
      />
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};