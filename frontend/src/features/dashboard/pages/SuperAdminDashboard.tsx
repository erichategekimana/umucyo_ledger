import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cooperativeService } from '@/api/cooperative.service';
import { harvestService } from '@/api/harvest.service';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  Building2, Users, AlertOctagon, Truck, ShoppingCart,
  Radio, FileBarChart, ChevronRight, CheckSquare, Shield
} from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [coopCount, setCoopCount] = useState(0);
  const [farmerCount, setFarmerCount] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [unresolvedDisc, setUnresolvedDisc] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cooperatives, farmers, deliveries, discResp] = await Promise.all([
          cooperativeService.listCooperatives({ page_size: 1 }),
          cooperativeService.listFarmers({ page_size: 1 }),
          harvestService.listDeliveries({ page_size: 1 }),
          harvestService.listDiscrepancies({ resolved: false, page_size: 5 }),
        ]);
        setCoopCount(cooperatives.count);
        setFarmerCount(farmers.count);
        setDeliveryCount(deliveries.count);
        setDiscrepancies(discResp.results);
        setUnresolvedDisc(discResp.count);
      } catch (error) {
        console.error('Failed to fetch superadmin data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activities = discrepancies.map((d) => ({
    id: d.id,
    icon: <AlertOctagon size={16} />,
    title: `Discrepancy — ${d.batch_details?.crop_type || 'Unknown'}`,
    description: `Ledger: ${d.ledger_weight_kg}kg · Invoice: ${d.invoice_weight_kg}kg · Drift: ${d.drift_kg}kg`,
    timestamp: d.created_at,
    badge: <span className="badge-red">Unresolved</span>,
  }));

  if (loading) return <LoadingSpinner message="Loading platform overview..." />;

  const quickLinks = [
    { to: ROUTES.APPROVALS, label: 'Pending Approvals', desc: 'Review registrations', icon: <CheckSquare size={20} />, color: 'bg-indigo-100 text-indigo-600' },
    { to: ROUTES.ROLE_MANAGEMENT, label: 'Role Management', desc: 'Manage access levels', icon: <Shield size={20} />, color: 'bg-rose-100 text-rose-600' },
    { to: ROUTES.COOPERATIVES, label: 'Cooperatives', desc: 'Manage registered cooperatives', icon: <Building2 size={20} />, color: 'bg-blue-100 text-blue-600' },
    { to: ROUTES.FARMERS, label: 'Farmers', desc: 'Browse farmer registry', icon: <Users size={20} />, color: 'bg-emerald-100 text-emerald-600' },
    { to: ROUTES.DELIVERIES, label: 'All Deliveries', desc: 'Full delivery log', icon: <Truck size={20} />, color: 'bg-amber-100 text-amber-600' },
    { to: ROUTES.SALES, label: 'Sales', desc: 'Bulk sales management', icon: <ShoppingCart size={20} />, color: 'bg-purple-100 text-purple-600' },
    { to: ROUTES.AUDIT_REPORT, label: 'Audit Report', desc: 'Financial audit view', icon: <FileBarChart size={20} />, color: 'bg-cyan-100 text-cyan-600' },
    { to: ROUTES.USSD_LOGS, label: 'USSD Logs', desc: 'Mobile gateway sessions', icon: <Radio size={20} />, color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <p className="page-subtitle">Super Admin · Full platform access</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Cooperatives"
          value={coopCount}
          subtitle="Registered cooperatives"
          icon={<Building2 size={22} />}
          color="blue"
        />
        <StatCard
          title="Total Farmers"
          value={farmerCount}
          subtitle="Enrolled farmers"
          icon={<Users size={22} />}
          color="emerald"
        />
        <StatCard
          title="Crop Deliveries"
          value={deliveryCount}
          subtitle="All time deliveries"
          icon={<Truck size={22} />}
          color="amber"
        />
        <StatCard
          title="Unresolved Discrepancies"
          value={unresolvedDisc}
          subtitle="Flagged for review"
          icon={<AlertOctagon size={22} />}
          color="red"
        />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="content-card flex items-center gap-4 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className={`stat-card-icon ${link.color}`}>{link.icon}</div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">{link.label}</p>
                <p className="text-xs text-slate-500 truncate">{link.desc}</p>
              </div>
              <ChevronRight size={15} className="ml-auto text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      <ActivityFeed
        activities={activities}
        title={`Unresolved Discrepancies ${unresolvedDisc > 0 ? `(${unresolvedDisc})` : ''}`}
        maxItems={5}
      />
    </div>
  );
};