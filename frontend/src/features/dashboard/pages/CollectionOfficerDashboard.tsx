import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { harvestService } from '@/api/harvest.service';
import { cooperativeService } from '@/api/cooperative.service';
import { CropDelivery, Farmer } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';

export const FarmerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalKg, setTotalKg] = useState(0);
  const [deliveries, setDeliveries] = useState<CropDelivery[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch farmer profile to get total_season_kg
        const farmers = await cooperativeService.listFarmers({ user: user?.id });
        const farmer = farmers[0];
        if (farmer) {
          setTotalKg(farmer.total_season_kg || 0);
        }

        // Fetch deliveries for this farmer
        const deliveriesData = await harvestService.listDeliveries({ farmer: farmer?.id, ordering: '-dropoff_time' });
        setDeliveries(deliveriesData);
      } catch (error) {
        console.error('Failed to fetch farmer data', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const activities = deliveries.map(d => ({
    id: d.id,
    title: `${d.weight_kg}kg ${d.crop_type}`,
    description: `Officer: ${d.officer_username}`,
    timestamp: d.dropoff_time,
  }));

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Farmer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Season Weight" value={`${totalKg} kg`} />
        <StatCard title="Number of Deliveries" value={deliveries.length} />
        {/* Add more stats as needed */}
      </div>
      <ActivityFeed activities={activities} title="Recent Deliveries" />
    </div>
  );
};