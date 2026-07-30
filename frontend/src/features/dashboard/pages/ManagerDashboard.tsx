import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { harvestService } from '@/api/harvest.service';
import { BatchTotal, CropDelivery } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Layers, Truck, Scale, DollarSign, Lock, ChevronRight, Plus, ShoppingCart } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { salesService } from '@/api/sales.service';

export const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<BatchTotal[]>([]);
  const [deliveries, setDeliveries] = useState<CropDelivery[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchesResp, deliveriesResp, salesResp] = await Promise.all([
          harvestService.listBatches({ page_size: 50, ordering: '-created_at' }),
          harvestService.listDeliveries({ ordering: '-dropoff_time', page_size: 5 }),
          salesService.listSales({ page_size: 100 }),
        ]);
        setBatches(batchesResp.results);
        setDeliveries(deliveriesResp.results);
        setTotalWeight(batchesResp.results.reduce((acc, b) => acc + (b.total_weight_kg || 0), 0));
        setTotalSales(salesResp.results.reduce((acc, s) => acc + (s.total_amount || 0), 0));
      } catch (error) {
        console.error('Failed to fetch data', error);
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
    description: `${d.farmer_name} · by ${d.officer_username}`,
    timestamp: d.dropoff_time,
    badge: (
      <span className="badge-green">Delivered</span>
    ),
  }));

  const openBatches = batches.filter((b) => b.status === 'OPEN').length;
  const lockedBatches = batches.filter((b) => b.status === 'LOCKED').length;

  if (loading) return <LoadingSpinner message="Loading manager dashboard..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manager Dashboard</h1>
          <p className="page-subtitle">Cooperative harvest overview & operations</p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.SALES_NEW} className="btn-primary">
            <Plus size={16} /> New Sale
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Harvest Weight"
          value={`${totalWeight.toFixed(0)} kg`}
          subtitle="All batches combined"
          icon={<Scale size={22} />}
          color="emerald"
        />
        <StatCard
          title="Total Batches"
          value={batches.length}
          subtitle={`${openBatches} open · ${lockedBatches} locked`}
          icon={<Layers size={22} />}
          color="blue"
        />
        <StatCard
          title="Open Batches"
          value={openBatches}
          subtitle="Batches awaiting lock"
          icon={<Truck size={22} />}
          color="amber"
        />
        <StatCard
          title="Total Sales Revenue"
          value={totalSales > 0 ? `${totalSales.toLocaleString()} RWF` : '—'}
          subtitle="All processed sales"
          icon={<DollarSign size={22} />}
          color="purple"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: ROUTES.BATCHES, label: 'Manage Batches', desc: 'Lock and review harvest batches', icon: <Layers size={20} />, color: 'bg-blue-100 text-blue-600' },
          { to: ROUTES.DELIVERIES, label: 'View Deliveries', desc: 'All logged crop deliveries', icon: <Truck size={20} />, color: 'bg-emerald-100 text-emerald-600' },
          { to: ROUTES.SALES, label: 'Sales & Payouts', desc: 'Manage bulk sales and payouts', icon: <ShoppingCart size={20} />, color: 'bg-purple-100 text-purple-600' },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="content-card flex items-center gap-4 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className={`stat-card-icon ${action.color}`}>{action.icon}</div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800">{action.label}</p>
              <p className="text-xs text-slate-500 truncate">{action.desc}</p>
            </div>
            <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-600 shrink-0 transition-colors" />
          </Link>
        ))}
      </div>

      <ActivityFeed activities={activities} title="Recent Deliveries" maxItems={5} />
    </div>
  );
};