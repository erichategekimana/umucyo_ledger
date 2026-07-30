import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { salesService } from '@/api/sales.service';
import { BulkSale } from '@/types';
import { Table } from '@/components/common/Table';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const SaleList = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<BulkSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canCreate = ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await salesService.listSales({ page: pageNum, ordering: '-sale_date' });
      setSales(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch sales', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const columns = [
    { header: 'Cooperative', accessor: 'cooperative_name' as keyof BulkSale },
    { header: 'Buyer', accessor: 'buyer' as keyof BulkSale },
    { header: 'Crop Type', accessor: 'batch_crop_type' as keyof BulkSale },
    { header: 'Total Weight (kg)', accessor: (row: BulkSale) => row.total_weight_kg?.toFixed(2) || '0' },
    { header: 'Total Amount (RWF)', accessor: (row: BulkSale) => row.total_amount?.toFixed(2) || '0' },
    { header: 'Status', accessor: (row: BulkSale) => (
      <span className={`px-2 py-1 rounded text-xs ${row.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : row.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
        {row.status}
      </span>
    )},
    { header: 'Sale Date', accessor: (row: BulkSale) => new Date(row.sale_date).toLocaleDateString() },
  ];

  if (loading && !sales.length) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bulk Sales</h1>
        {canCreate && (
          <Link
            to={ROUTES.SALES_NEW}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            New Sale
          </Link>
        )}
      </div>
      <Table
        data={sales}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No sales found"
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