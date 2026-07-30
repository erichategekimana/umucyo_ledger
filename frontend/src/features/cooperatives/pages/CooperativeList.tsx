import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cooperativeService } from '@/api/cooperative.service';
import { Cooperative } from '@/types';
import { Table } from '@/components/common/Table';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

export const CooperativeList = () => {
  const { user } = useAuth();
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await cooperativeService.listCooperatives({ page: pageNum });
      setCooperatives(resp.results);
      // Assuming page_size is default 25, we can calculate total pages
      const total = resp.count;
      const pageSize = 25; // default from backend
      setTotalPages(Math.ceil(total / pageSize));
    } catch (error) {
      console.error('Failed to fetch cooperatives', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Cooperative },
    { header: 'District', accessor: 'district' as keyof Cooperative },
    { header: 'Sector', accessor: 'sector' as keyof Cooperative },
    { header: 'Registration No', accessor: 'rca_registration_no' as keyof Cooperative },
    {
      header: 'Actions',
      accessor: (row: Cooperative) => (
        <div className="flex space-x-2">
          {canManage && (
            <Link
              to={ROUTES.COOPERATIVE_EDIT(row.id)}
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
        <h1 className="text-2xl font-bold">Cooperatives</h1>
        {canManage && (
          <Link
            to={ROUTES.COOPERATIVE_NEW}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            New Cooperative
          </Link>
        )}
      </div>

      <Table
        data={cooperatives}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No cooperatives found"
      />

      {/* Simple pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
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