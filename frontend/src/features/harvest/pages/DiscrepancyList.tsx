import { useEffect, useState } from 'react';
import { harvestService } from '@/api/harvest.service';
import { DiscrepancyFlag } from '@/types';
import { Table } from '@/components/common/Table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const DiscrepancyList = () => {
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await harvestService.listDiscrepancies({ page: pageNum, ordering: '-created_at' });
      setDiscrepancies(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch discrepancies', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handleResolve = async (id: string) => {
    if (!window.confirm('Mark this discrepancy as resolved?')) return;
    setResolving(id);
    try {
      await harvestService.resolveDiscrepancy(id);
      await fetchData(page);
    } catch (error) {
      console.error('Failed to resolve discrepancy', error);
      alert('Failed to resolve discrepancy.');
    } finally {
      setResolving(null);
    }
  };

  const columns = [
    { header: 'Cooperative', accessor: (row: DiscrepancyFlag) => row.batch_details.cooperative },
    { header: 'Crop Type', accessor: (row: DiscrepancyFlag) => row.batch_details.crop_type },
    { header: 'Season', accessor: (row: DiscrepancyFlag) => row.batch_details.season_label },
    { header: 'Ledger (kg)', accessor: (row: DiscrepancyFlag) => Number(row.ledger_weight_kg || 0).toFixed(2) || '0' },
    { header: 'Invoice (kg)', accessor: (row: DiscrepancyFlag) => Number(row.invoice_weight_kg || 0).toFixed(2) || '0' },
    { header: 'Drift (kg)', accessor: (row: DiscrepancyFlag) => Number(row.drift_kg || 0).toFixed(2) || '0' },
    { header: 'Status', accessor: (row: DiscrepancyFlag) => (
      <span className={`px-2 py-1 rounded text-xs ${row.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {row.resolved ? 'Resolved' : 'Open'}
      </span>
    )},
    { header: 'Created', accessor: (row: DiscrepancyFlag) => new Date(row.created_at).toLocaleDateString() },
    {
      header: 'Actions',
      accessor: (row: DiscrepancyFlag) => (
        !row.resolved && (
          <button
            onClick={() => handleResolve(row.id)}
            disabled={resolving === row.id}
            className="text-green-600 hover:text-green-900 disabled:opacity-50"
          >
            {resolving === row.id ? '...' : 'Resolve'}
          </button>
        )
      ),
    },
  ];

  if (loading && !discrepancies.length) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Discrepancy Flags</h1>
      <Table
        data={discrepancies}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No discrepancies found"
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