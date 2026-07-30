import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { harvestService } from '@/api/harvest.service';
import { CropDelivery } from '@/types';
import { Table } from '@/components/common/Table';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cooperativeService } from '../../../api/cooperative.service';

export const DeliveryList = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<CropDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [farmerId, setFarmerId] = useState<string | null>(null);

  const canCreate = user?.role === 'COLLECTION_OFFICER' || user?.role === 'SUPER_ADMIN';

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const resp = await harvestService.listDeliveries({ page: pageNum, ordering: '-dropoff_time' });
      setDeliveries(resp.results);
      const pageSize = 25;
      setTotalPages(Math.ceil(resp.count / pageSize));
    } catch (error) {
      console.error('Failed to fetch deliveries', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

      if (user?.role === 'FARMER') {
        // Fetch the farmer's profile to get ID
        cooperativeService.listFarmers({ user: user.id, page_size: 1 })
        .then(resp => {
            if (resp.results.length > 0) {
            setFarmerId(resp.results[0].id);
            }
        })
        .catch(console.error);
    }
    }, [user]);


    fetchData(page);
    // In fetchData, add filter:
const params: any = { page: pageNum, ordering: '-dropoff_time' };
if (farmerId) params.farmer = farmerId;
const resp = await harvestService.listDeliveries(params);
  }, [page]);

  const columns = [
    { header: 'Farmer', accessor: 'farmer_name' as keyof CropDelivery },
    { header: 'Crop Type', accessor: 'crop_type' as keyof CropDelivery },
    { header: 'Weight (kg)', accessor: (row: CropDelivery) => row.weight_kg?.toFixed(2) || '0' },
    { header: 'Officer', accessor: 'officer_username' as keyof CropDelivery },
    { header: 'Cooperative', accessor: 'cooperative_name' as keyof CropDelivery },
    { header: 'Drop-off Time', accessor: (row: CropDelivery) => new Date(row.dropoff_time).toLocaleString() },
  ];

  if (loading && !deliveries.length) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Deliveries</h1>
        {canCreate && (
          <Link
            to={ROUTES.DELIVERY_NEW}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            New Delivery
          </Link>
        )}
      </div>
      <Table
        data={deliveries}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No deliveries found"
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