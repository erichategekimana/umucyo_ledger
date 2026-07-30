import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { harvestService } from '@/api/harvest.service';
import { CropDelivery } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const CollectionOfficerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<CropDelivery[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent deliveries (all, but we'll filter by officer if needed)
        const resp = await harvestService.listDeliveries({
          ordering: '-dropoff_time',
          page_size: 10,
        });
        const allDeliveries = resp.results;
        setDeliveries(allDeliveries);

        // Count today's deliveries (by officer if we had filtering)
        const today = new Date().toDateString();
        const todayDeliveries = allDeliveries.filter(d => new Date(d.dropoff_time).toDateString() === today);
        setTodayCount(todayDeliveries.length);
      } catch (error) {
        console.error('Failed to fetch deliveries', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activities = deliveries.map(d => ({
    id: d.id,
    title: `${d.weight_kg}kg ${d.crop_type} - ${d.farmer_name}`,
    description: `Batch: ${d.batch}`,
    timestamp: d.dropoff_time,
  }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Collection Officer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Today's Deliveries" value={todayCount} />
        <StatCard title="Recent Deliveries" value={deliveries.length} />
      </div>
      <ActivityFeed activities={activities} title="Recent Deliveries" />
    </div>
  );
};