import { useEffect, useState } from 'react';
import { harvestService } from '@/api/harvest.service';
import { BatchTotal } from '@/types';
import { Table } from '@/components/common/Table';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const BatchList = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canLock = user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';
  const canFlag = user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await harvestService.listBatches({ page: pageNum, ordering: '-created_at' });
      setBatches(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch batches', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handleLock = async (id: string) => {
    if (!window.confirm('Lock this batch? This will freeze the total weight.')) return;
    setActionLoading(id);
    try {
      await harvestService.lockBatch(id);
      await fetchData(page); // refresh
    } catch (error) {
      console.error('Failed to lock batch', error);
      alert('Failed to lock batch. It may already be locked.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async (id: string) => {
    const invoiceWeight = prompt('Enter invoice weight (kg):');
    if (invoiceWeight === null) return;
    const weight = parseFloat(invoiceWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }
    setActionLoading(id);
    try {
      const result = await harvestService.flagDiscrepancy(id, weight);
      alert(`Flagged! Ledger: ${result.ledger_weight_kg}kg, Invoice: ${result.invoice_weight_kg}kg, Drift: ${(result.ledger_weight_kg - result.invoice_weight_kg).toFixed(2)}kg`);
      await fetchData(page);
    } catch (error) {
      console.error('Failed to flag discrepancy', error);
      alert('Failed to flag discrepancy.');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    { header: 'Cooperative', accessor: 'cooperative_name' as keyof BatchTotal },
    { header: 'Crop Type', accessor: 'crop_type' as keyof BatchTotal },
    { header: 'Season', accessor: 'season_label' as keyof BatchTotal },
    { header: 'Total Weight (kg)', accessor: (row: BatchTotal) => row.total_weight_kg?.toFixed(2) || '0' },
    { header: 'Status', accessor: (row: BatchTotal) => (
      <span className={`px-2 py-1 rounded text-xs ${row.status === 'LOCKED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {row.status}
      </span>
    )},
    { header: 'Created', accessor: (row: BatchTotal) => new Date(row.created_at).toLocaleDateString() },
    {
      header: 'Actions',
      accessor: (row: BatchTotal) => (
        <div className="flex space-x-2">
          {canLock && row.status === 'OPEN' && (
            <button
              onClick={() => handleLock(row.id)}
              disabled={actionLoading === row.id}
              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
            >
              {actionLoading === row.id ? '...' : 'Lock'}
            </button>
          )}
          {canFlag && (
            <button
              onClick={() => handleFlag(row.id)}
              disabled={actionLoading === row.id}
              className="text-red-600 hover:text-red-900 disabled:opacity-50"
            >
              {actionLoading === row.id ? '...' : 'Flag'}
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading && !batches.length) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Batches</h1>
      <Table
        data={batches}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No batches found"
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