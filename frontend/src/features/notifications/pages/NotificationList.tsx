import { useEffect, useState } from 'react';
import { notificationService } from '@/api/notification.service';
import { Notification } from '@/types';
import { Table } from '@/components/common/Table';
import { useAuth } from '@/hooks/useAuth';
import { cooperativeService } from '@/api/cooperative.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const NotificationList = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [farmerId, setFarmerId] = useState<string | null>(null);

  // Filters
  const [farmerFilter, setFarmerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch farmer ID if user is FARMER
  useEffect(() => {
    if (user?.role === 'FARMER') {
      cooperativeService.listFarmers({ user: user.id, page_size: 1 })
        .then(resp => {
          if (resp.results.length > 0) {
            setFarmerId(resp.results[0].id);
            setFarmerFilter(resp.results[0].id);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, ordering: '-sent_at' };
      if (farmerFilter) params.farmer = farmerFilter;
      if (startDate) params.sent_at__gte = startDate;
      if (endDate) params.sent_at__lte = endDate;

      const resp = await notificationService.listNotifications(params);
      setNotifications(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page, farmerFilter, startDate, endDate]);

  // Only show farmer filter if not a farmer (since they're already filtered)
  const showFarmerFilter = user?.role !== 'FARMER';

  const columns = [
    { header: 'Farmer', accessor: 'farmer_name' as keyof Notification },
    { header: 'Phone', accessor: 'farmer_phone' as keyof Notification },
    { header: 'Delivery ID', accessor: 'delivery_id_str' as keyof Notification },
    { header: 'Message', accessor: (row: Notification) => row.message.slice(0, 60) + (row.message.length > 60 ? '...' : '') },
    { header: 'Sent At', accessor: (row: Notification) => new Date(row.sent_at).toLocaleString() },
  ];

  if (loading && !notifications.length) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {showFarmerFilter && (
            <div>
              <label className="block text-sm font-medium">Farmer</label>
              <input
                type="text"
                placeholder="Farmer ID or name"
                value={farmerFilter}
                onChange={(e) => setFarmerFilter(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          )}
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
            onClick={() => { setFarmerFilter(''); setStartDate(''); setEndDate(''); }}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <Table
        data={notifications}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No notifications found"
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