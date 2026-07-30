import { useEffect, useState } from 'react';
import { ussdService } from '@/api/ussd.service';
import { USSDLog } from '@/types';
import { Table } from '@/components/common/Table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const USSDLogList = () => {
  const [logs, setLogs] = useState<USSDLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [phoneFilter, setPhoneFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, ordering: '-created_at' };
      if (phoneFilter) params.phone_number = phoneFilter;
      if (startDate) params.created_at__gte = startDate;
      if (endDate) params.created_at__lte = endDate;

      const resp = await ussdService.listLogs(params);
      setLogs(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch USSD logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page, phoneFilter, startDate, endDate]);

  const columns = [
    { header: 'Phone', accessor: 'phone_number' as keyof USSDLog },
    { header: 'Session ID', accessor: 'session_id' as keyof USSDLog },
    { header: 'Input', accessor: 'text' as keyof USSDLog },
    { header: 'Response', accessor: (row: USSDLog) => row.response.slice(0, 60) + (row.response.length > 60 ? '...' : '') },
    { header: 'Level', accessor: 'menu_level' as keyof USSDLog },
    { header: 'Final', accessor: (row: USSDLog) => row.is_final ? 'Yes' : 'No' },
    { header: 'Time', accessor: (row: USSDLog) => new Date(row.created_at).toLocaleString() },
  ];

  if (loading && !logs.length) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">USSD Session Logs</h1>
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Phone Number</label>
            <input
              type="text"
              placeholder="Enter phone number"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => { setPhoneFilter(''); setStartDate(''); setEndDate(''); }}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <Table
        data={logs}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No USSD logs found"
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