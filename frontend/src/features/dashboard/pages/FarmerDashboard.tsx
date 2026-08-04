import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { harvestService } from '@/api/harvest.service';
import { cooperativeService } from '@/api/cooperative.service';
import { CropDelivery, Farmer } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Truck, Leaf, Bell, ChevronRight, Scale, DollarSign } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const FarmerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalKg, setTotalKg] = useState(0);
  const [totalEarningsRwf, setTotalEarningsRwf] = useState(0);
  const [deliveries, setDeliveries] = useState<CropDelivery[]>([]);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

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

        if (farmer) {
          const b = await cooperativeService.getFarmerBalance(farmer.id);
          setBalanceData(b);
          if (b && b.total_earnings_rwf !== undefined) {
            setTotalEarningsRwf(b.total_earnings_rwf);
          }
        }
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
        <Link to={ROUTES.DELIVERY_NEW} className="btn-primary">
          <Truck size={16} /> Log New Delivery
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Season Weight"
          value={totalKg > 0 ? `${Number(totalKg || 0).toFixed(1)} kg` : '0 kg'}
          subtitle="Cumulative delivered this season"
          icon={<Scale size={22} />}
          color="emerald"
        />
        <StatCard
          title="Estimated Season Earnings"
          value={`${Number(totalEarningsRwf || 0).toLocaleString()} RWF`}
          subtitle="Based on national crop price per 1kg"
          icon={<DollarSign size={22} />}
          color="amber"
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

        <button
          onClick={async () => {
            setBalanceLoading(true);
            try {
              const farmersResp = await cooperativeService.listFarmers({ user: user?.id, page_size: 1 });
              if (farmersResp.results.length > 0) {
                const b = await cooperativeService.getFarmerBalance(farmersResp.results[0].id);
                setBalanceData(b);
              }
            } catch (err) {
              console.error(err);
            } finally {
              setBalanceLoading(false);
            }
          }}
          disabled={balanceLoading}
          className="content-card flex items-center gap-4 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group text-left"
        >
          <div className="stat-card-icon bg-amber-100 text-amber-600">
            {balanceLoading ? <LoadingSpinner /> : <Scale size={20} />}
          </div>
          <div>
            <p className="font-semibold text-slate-800">Check Balance</p>
            <p className="text-xs text-slate-500">Query your pending ledger balances</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-amber-500 transition-colors" />
        </button>
      </div>

      {balanceData && (
        <div className="content-card p-5 bg-amber-50/50 border border-amber-100">
          <h3 className="font-semibold text-amber-900 mb-2">Live Balance Summary</h3>
          <p className="text-sm text-amber-800">Available Payouts: <strong>{balanceData.available_payouts} RWF</strong></p>
          <p className="text-sm text-amber-800">Season Delivered: <strong>{balanceData.total_season_kg} kg</strong></p>
        </div>
      )}

      {/* Activity */}
      <ActivityFeed activities={activities} title="Recent Deliveries" maxItems={5} />
    </div>
  );
};