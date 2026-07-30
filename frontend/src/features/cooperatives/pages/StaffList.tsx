import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cooperativeService } from '@/api/cooperative.service';
import { CooperativeStaff } from '@/types';
import { Table } from '@/components/common/Table';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

export const StaffList = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<CooperativeStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await cooperativeService.listStaff({ page: pageNum });
      setStaff(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch staff', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const columns = [
    { header: 'Username', accessor: (row: CooperativeStaff) => row.user_details.username },
    { header: 'Email', accessor: (row: CooperativeStaff) => row.user_details.email },
    { header: 'Phone', accessor: (row: CooperativeStaff) => row.user_details.phone_number },
    { header: 'Role', accessor: (row: CooperativeStaff) => row.user_details.role },
    { header: 'Cooperative', accessor: 'cooperative_name' as keyof CooperativeStaff },
    {
      header: 'Actions',
      accessor: (row: CooperativeStaff) => (
        <div className="flex space-x-2">
          {canManage && (
            <Link
              to={ROUTES.STAFF_EDIT(row.id)}
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
        <h1 className="text-2xl font-bold">Cooperative Staff</h1>
        {canManage && (
          <Link
            to={ROUTES.STAFF_NEW}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            New Staff
          </Link>
        )}
      </div>

      <Table
        data={staff}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No staff found"
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