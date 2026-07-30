import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { harvestService } from '@/api/harvest.service';
import { cooperativeService } from '@/api/cooperative.service';
import { CropDelivery, Farmer } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Truck, Leaf, Bell, ChevronRight, Scale } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const FarmerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalKg, setTotalKg] = useState(0);
  const [deliveries, setDeliveries] = useState<CropDelivery[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const farmersResp = await cooperativeService.listFarmers({ user: user.id, page_size: 1 });
        const farmer = farmersResp.results[0];
        if (farmer) setTotalKg(farmer.total_season_kg || 0);

        const deliveriesResp = await harvestService.listDeliveries({
          ordering: '-dropoff_time',
          page_size: 5,
        });
        setDeliveries(deliveriesResp.results);
      } catch (error) {
        console.error('Failed to fetch farmer data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const activities = deliveries.map((d) => ({
    id: d.id,
    icon: <Truck size={16} />,
    title: `${d.weight_kg} kg ${d.crop_type}`,
    description: `Recorded by ${d.officer_username}`,
    timestamp: d.dropoff_time,
    badge: (
      <span className="badge-green">
        <Scale size={10} /> {d.weight_kg} kg
      </span>
    ),
  }));

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.username} 🌾</p>
        </div>
        <Link to={ROUTES.NOTIFICATIONS} className="btn-outline">
          <Bell size={16} /> Notifications
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Season Weight"
          value={totalKg > 0 ? `${totalKg.toFixed(1)} kg` : '0 kg'}
          subtitle="Cumulative delivered this season"
          icon={<Scale size={22} />}
          color="emerald"
        />
        <StatCard
          title="Number of Deliveries"
          value={deliveries.length}
          subtitle="Total recorded deliveries"
          icon={<Truck size={22} />}
          color="blue"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to={ROUTES.DELIVERIES}
          className="content-card flex items-center gap-4 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="stat-card-icon bg-emerald-100 text-emerald-600">
            <Truck size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">View My Deliveries</p>
            <p className="text-xs text-slate-500">All deliveries linked to your account</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </Link>

        <Link
          to={ROUTES.NOTIFICATIONS}
          className="content-card flex items-center gap-4 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="stat-card-icon bg-amber-100 text-amber-600">
            <Bell size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Notifications</p>
            <p className="text-xs text-slate-500">SMS receipts and delivery alerts</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-amber-500 transition-colors" />
        </Link>
      </div>

      {/* Activity */}
      <ActivityFeed activities={activities} title="Recent Deliveries" maxItems={5} />
    </div>
  );
};