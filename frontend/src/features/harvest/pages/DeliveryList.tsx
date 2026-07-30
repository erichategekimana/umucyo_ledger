import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { harvestService } from '@/api/harvest.service';
import { CropDelivery } from '@/types';
import { Table } from '@/components/common/Table';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cooperativeService } from '@/api/cooperative.service';
import { Plus, Truck, ChevronLeft, ChevronRight, Scale } from 'lucide-react';

export const DeliveryList = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<CropDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [farmerId, setFarmerId] = useState<string | null>(null);

  const canCreate = user?.role === 'COLLECTION_OFFICER' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    if (user?.role === 'FARMER' && user.id) {
      cooperativeService
        .listFarmers({ user: user.id, page_size: 1 })
        .then((resp) => {
          if (resp.results && resp.results.length > 0) setFarmerId(resp.results[0].id);
        })
        .catch((err) => console.error('Failed to resolve farmer profile:', err));
    }
  }, [user]);

  const fetchData = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const params: Record<string, any> = { page: pageNum, ordering: '-dropoff_time' };
        if (user?.role === 'FARMER' && farmerId) params.farmer = farmerId;
        const resp = await harvestService.listDeliveries(params);
        setDeliveries(resp.results);
        setCount(resp.count);
        setTotalPages(Math.ceil(resp.count / 25) || 1);
      } catch (error) {
        console.error('Failed to fetch deliveries', error);
      } finally {
        setLoading(false);
      }
    },
    [farmerId, user?.role]
  );

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const columns = [
    {
      header: 'Farmer',
      accessor: (row: CropDelivery) => (
        <span className="font-semibold text-slate-800">{row.farmer_name || '—'}</span>
      ),
    },
    {
      header: 'Crop Type',
      accessor: (row: CropDelivery) => (
        <span className="badge-green">{row.crop_type}</span>
      ),
    },
    {
      header: 'Weight',
      accessor: (row: CropDelivery) => (
        <span className="font-semibold text-emerald-700">{row.weight_kg?.toFixed(2)} kg</span>
      ),
    },
    {
      header: 'Officer',
      accessor: 'officer_username' as keyof CropDelivery,
    },
    {
      header: 'Cooperative',
      accessor: 'cooperative_name' as keyof CropDelivery,
    },
    {
      header: 'Drop-off Time',
      accessor: (row: CropDelivery) => (
        <span className="text-slate-500 text-xs">{new Date(row.dropoff_time).toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user?.role === 'FARMER' ? 'My Deliveries' : 'Crop Deliveries'}
          </h1>
          <p className="page-subtitle">
            {count} {count === 1 ? 'delivery' : 'deliveries'} total
            {user?.role === 'FARMER' && ' · Showing only your records'}
          </p>
        </div>
        {canCreate && (
          <Link to={ROUTES.DELIVERY_NEW} className="btn-primary">
            <Plus size={16} /> Log Delivery
          </Link>
        )}
      </div>

      <div className="content-card">
        <Table
          data={deliveries}
          columns={columns}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="No deliveries found"
          emptyIcon={<Truck size={36} className="text-slate-200" />}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages} · {count} total records
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};