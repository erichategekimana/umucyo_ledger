import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cooperativeService } from '@/api/cooperative.service';
import { Farmer } from '@/types';
import { Table } from '@/components/common/Table';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

export const FarmerList = () => {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await cooperativeService.listFarmers({ page: pageNum });
      setFarmers(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch farmers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const columns = [
    { header: 'Full Name', accessor: 'full_name' as keyof Farmer },
    { header: 'Phone', accessor: 'phone_number' as keyof Farmer },
    { header: 'National ID', accessor: 'national_id' as keyof Farmer },
    { header: 'Cooperative', accessor: 'cooperative_name' as keyof Farmer },
    { header: 'Total Season Kg', accessor: (row: Farmer) => Number(row.total_season_kg || 0).toFixed(2) || '0' },
    {
      header: 'Actions',
      accessor: (row: Farmer) => (
        <div className="flex space-x-2">
          {canManage && (
            <Link
              to={ROUTES.FARMER_EDIT(row.id)}
              className="text-indigo-600 hover:text-indigo-900"
            >
              Edit
            </Link>
          )}
          <Link
            to={`/farmers/${row.id}/balance`} // optional detail
            className="text-green-600 hover:text-green-900"
          >
            Balance
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Farmers</h1>
        {canManage && (
          <Link
            to={ROUTES.FARMER_NEW}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            New Farmer
          </Link>
        )}
      </div>

      <Table
        data={farmers}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No farmers found"
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