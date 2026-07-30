import { useEffect, useState } from 'react';
import { salesService } from '@/api/sales.service';
import { RevenueDistribution } from '@/types';
import { Table } from '@/components/common/Table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const PayoutList = () => {
  const [payouts, setPayouts] = useState<RevenueDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await salesService.listPayouts({ page: pageNum, ordering: '-created_at' });
      setPayouts(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch payouts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const columns = [
    { header: 'Farmer', accessor: 'farmer_name' as keyof RevenueDistribution },
    { header: 'Amount (RWF)', accessor: (row: RevenueDistribution) => row.amount?.toFixed(2) || '0' },
    { header: 'Paid', accessor: (row: RevenueDistribution) => row.paid ? 'Yes' : 'No' },
    { header: 'Paid At', accessor: (row: RevenueDistribution) => row.paid_at ? new Date(row.paid_at).toLocaleString() : '-' },
    { header: 'Created', accessor: (row: RevenueDistribution) => new Date(row.created_at).toLocaleString() },
  ];

  if (loading && !payouts.length) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Revenue Payouts</h1>
      <Table
        data={payouts}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No payouts found"
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