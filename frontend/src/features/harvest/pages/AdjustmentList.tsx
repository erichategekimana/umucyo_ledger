import { useEffect, useState } from 'react';
import { harvestService } from '@/api/harvest.service';
import { AdjustmentLog } from '@/types';
import { Table } from '@/components/common/Table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const AdjustmentList = () => {
  const [adjustments, setAdjustments] = useState<AdjustmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await harvestService.listAdjustments({ page: pageNum, ordering: '-created_at' });
      setAdjustments(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch adjustments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const columns = [
    { header: 'Delivery ID', accessor: 'original_delivery' as keyof AdjustmentLog },
    { header: 'Corrected Weight (kg)', accessor: (row: AdjustmentLog) => Number(row.corrected_weight_kg || 0).toFixed(2) || '0' },
    { header: 'Reason', accessor: 'reason' as keyof AdjustmentLog },
    { header: 'Approved By', accessor: 'approved_by_username' as keyof AdjustmentLog },
    { header: 'Created', accessor: (row: AdjustmentLog) => new Date(row.created_at).toLocaleString() },
  ];

  if (loading && !adjustments.length) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Adjustment Logs</h1>
      <Table
        data={adjustments}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No adjustments found"
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