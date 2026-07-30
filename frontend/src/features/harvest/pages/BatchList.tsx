import { useEffect, useState } from 'react';
import { harvestService } from '@/api/harvest.service';
import { BatchTotal } from '@/types';
import { Table } from '@/components/common/Table';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Layers, Lock, Flag, ChevronLeft, ChevronRight } from 'lucide-react';

export const BatchList = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canLock = user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const canFlag = user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await harvestService.listBatches({ page: pageNum, ordering: '-created_at' });
      setBatches(resp.results);
      setCount(resp.count);
      setTotalPages(Math.ceil(resp.count / 25) || 1);
    } catch (error) {
      console.error('Failed to fetch batches', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(page); }, [page]);

  const handleLock = async (id: string) => {
    if (!window.confirm('Lock this batch? This will freeze the total weight and no new deliveries can be added.')) return;
    setActionLoading(id);
    try {
      await harvestService.lockBatch(id);
      await fetchData(page);
    } catch (error) {
      console.error('Failed to lock batch', error);
      alert('Failed to lock batch. It may already be locked.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async (id: string) => {
    const invoiceWeight = prompt('Enter invoice weight (kg) to flag discrepancy:');
    if (invoiceWeight === null) return;
    const weight = parseFloat(invoiceWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }
    setActionLoading(id);
    try {
      const result = await harvestService.flagDiscrepancy(id, weight);
      alert(`Flagged!\n• Ledger: ${result.ledger_weight_kg}kg\n• Invoice: ${result.invoice_weight_kg}kg\n• Drift: ${(result.ledger_weight_kg - result.invoice_weight_kg).toFixed(2)}kg`);
      await fetchData(page);
    } catch (error) {
      alert('Failed to flag discrepancy.');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    {
      header: 'Cooperative',
      accessor: (row: BatchTotal) => (
        <span className="font-semibold text-slate-800">{row.cooperative_name}</span>
      ),
    },
    {
      header: 'Crop Type',
      accessor: (row: BatchTotal) => (
        <span className="badge-green">{row.crop_type}</span>
      ),
    },
    {
      header: 'Season',
      accessor: 'season_label' as keyof BatchTotal,
    },
    {
      header: 'Total Weight',
      accessor: (row: BatchTotal) => (
        <span className="font-semibold text-emerald-700">{row.total_weight_kg?.toFixed(2)} kg</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: BatchTotal) =>
        row.status === 'LOCKED' ? (
          <span className="badge-gray"><Lock size={10} /> Locked</span>
        ) : (
          <span className="badge-yellow">Open</span>
        ),
    },
    {
      header: 'Created',
      accessor: (row: BatchTotal) => (
        <span className="text-slate-500 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: BatchTotal) => (
        <div className="flex gap-2">
          {canLock && row.status === 'OPEN' && (
            <button
              onClick={() => handleLock(row.id)}
              disabled={actionLoading === row.id}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <Lock size={13} /> {actionLoading === row.id ? '…' : 'Lock'}
            </button>
          )}
          {canFlag && (
            <button
              onClick={() => handleFlag(row.id)}
              disabled={actionLoading === row.id}
              className="btn text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
            >
              <Flag size={13} /> {actionLoading === row.id ? '…' : 'Flag'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Harvest Batches</h1>
          <p className="page-subtitle">{count} batches total</p>
        </div>
      </div>

      <div className="content-card">
        <Table
          data={batches}
          columns={columns}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="No batches found"
          emptyIcon={<Layers size={36} className="text-slate-200" />}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-40">
              <ChevronLeft size={16} /> Previous
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary disabled:opacity-40">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};