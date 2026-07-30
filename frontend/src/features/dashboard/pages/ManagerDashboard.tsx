import { useEffect, useState } from 'react';
import { harvestService } from '@/api/harvest.service';
import { BatchTotal, CropDelivery } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<BatchTotal[]>([]);
  const [deliveries, setDeliveries] = useState<CropDelivery[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const batchesResp = await harvestService.listBatches({ page_size: 10, ordering: '-created_at' });
        setBatches(batchesResp.results);

        const deliveriesResp = await harvestService.listDeliveries({ ordering: '-dropoff_time', page_size: 5 });
        setDeliveries(deliveriesResp.results);

        // Sum total weight from batches
        const total = batchesResp.results.reduce((acc, b) => acc + (b.total_weight_kg || 0), 0);
        setTotalWeight(total);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activities = deliveries.map(d => ({
    id: d.id,
    title: `${d.weight_kg}kg ${d.crop_type} - ${d.farmer_name}`,
    description: `Officer: ${d.officer_username}`,
    timestamp: d.dropoff_time,
  }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manager Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Harvest Weight" value={`${totalWeight} kg`} />
        <StatCard title="Total Batches" value={batches.length} />
        <StatCard title="Open Batches" value={batches.filter(b => b.status === 'OPEN').length} />
      </div>
      <ActivityFeed activities={activities} title="Recent Deliveries" />
    </div>
  );
};