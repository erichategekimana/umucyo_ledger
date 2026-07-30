import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { harvestService } from '@/api/harvest.service';
import { CropDelivery } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Truck, Plus, Calendar, Users, ChevronRight, Scale } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const CollectionOfficerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<CropDelivery[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await harvestService.listDeliveries({
          ordering: '-dropoff_time',
          page_size: 10,
        });
        const all = resp.results;
        setDeliveries(all);
        const today = new Date().toDateString();
        setTodayCount(all.filter((d) => new Date(d.dropoff_time).toDateString() === today).length);
        setTotalWeight(all.reduce((sum, d) => sum + (d.weight_kg || 0), 0));
      } catch (error) {
        console.error('Failed to fetch deliveries', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activities = deliveries.map((d) => ({
    id: d.id,
    icon: <Truck size={16} />,
    title: `${d.weight_kg} kg ${d.crop_type}`,
    description: `Farmer: ${d.farmer_name}`,
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Officer Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.username} — manage crop deliveries below</p>
        </div>
        <Link to={ROUTES.DELIVERY_NEW} className="btn-primary">
          <Plus size={16} /> Log New Delivery
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today's Deliveries"
          value={todayCount}
          subtitle="Recorded today"
          icon={<Calendar size={22} />}
          color="emerald"
        />
        <StatCard
          title="Recent Deliveries"
          value={deliveries.length}
          subtitle="Last 10 records"
          icon={<Truck size={22} />}
          color="blue"
        />
        <StatCard
          title="Total Weight Collected"
          value={`${Number(totalWeight || 0).toFixed(1)} kg`}
          subtitle="Recent 10 deliveries"
          icon={<Scale size={22} />}
          color="amber"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to={ROUTES.DELIVERY_NEW}
          className="content-card flex items-center gap-4 p-5 bg-emerald-500 text-white hover:bg-emerald-600 transition-all hover:-translate-y-0.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Plus size={20} />
          </div>
          <div>
            <p className="font-bold">Log New Delivery</p>
            <p className="text-emerald-100 text-xs">Record a farmer's crop drop-off</p>
          </div>
          <ChevronRight size={16} className="ml-auto opacity-70 group-hover:opacity-100" />
        </Link>

        <Link
          to={ROUTES.DELIVERIES}
          className="content-card flex items-center gap-4 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="stat-card-icon bg-blue-100 text-blue-600">
            <Truck size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">All Deliveries</p>
            <p className="text-xs text-slate-500">Browse complete delivery log</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-600 transition-colors" />
        </Link>
      </div>

      <ActivityFeed activities={activities} title="Recent Deliveries" maxItems={5} />
    </div>
  );
};