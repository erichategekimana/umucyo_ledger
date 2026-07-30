import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cooperativeService } from '@/api/cooperative.service';
import { Cooperative, CooperativeStaff, Farmer } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/config/routes';
import { 
  Building2, Users, CheckSquare, Shield, ChevronRight, Truck
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cooperative, setCooperative] = useState<Cooperative | null>(null);
  const [staffCount, setStaffCount] = useState(0);
  const [farmerCount, setFarmerCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const staffResp = await cooperativeService.listStaff({ user: user.id, page_size: 1 });
        const staff = staffResp.results[0];
        if (staff) {
          const coopResp = await cooperativeService.getCooperative(staff.cooperative);
          setCooperative(coopResp);
          
          const staffAll = await cooperativeService.listStaff({ cooperative: staff.cooperative });
          setStaffCount(staffAll.count);
          const farmersAll = await cooperativeService.listFarmers({ cooperative: staff.cooperative });
          setFarmerCount(farmersAll.count);
        }
      } catch (error) {
        console.error('Failed to fetch admin data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <LoadingSpinner message="Loading cooperative data..." />;

  const quickLinks = [
    { to: ROUTES.APPROVALS, label: 'Pending Approvals', desc: 'Review farmer registrations', icon: <CheckSquare size={20} />, color: 'bg-indigo-100 text-indigo-600' },
    { to: ROUTES.ROLE_MANAGEMENT, label: 'Role Management', desc: 'Manage access levels', icon: <Shield size={20} />, color: 'bg-rose-100 text-rose-600' },
    { to: ROUTES.STAFF, label: 'Staff Management', desc: 'Manage cooperative staff', icon: <Building2 size={20} />, color: 'bg-blue-100 text-blue-600' },
    { to: ROUTES.FARMERS, label: 'Farmers', desc: 'Browse farmer registry', icon: <Users size={20} />, color: 'bg-emerald-100 text-emerald-600' },
    { to: ROUTES.DELIVERIES, label: 'Deliveries', desc: 'View cooperative deliveries', icon: <Truck size={20} />, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cooperative Admin Dashboard</h1>
          <p className="page-subtitle">{cooperative ? cooperative.name : 'Cooperative Manager'}</p>
        </div>
      </div>
      
      {cooperative && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{cooperative.name}</h2>
            <p className="text-sm text-slate-500 mt-1">District: {cooperative.district} · Sector: {cooperative.sector}</p>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-sm font-medium text-slate-600">
            Reg No: {cooperative.rca_registration_no || 'N/A'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Staff Members" value={staffCount} subtitle="Active staff" icon={<Building2 size={22} />} color="blue" />
        <StatCard title="Farmers" value={farmerCount} subtitle="Registered farmers" icon={<Users size={22} />} color="emerald" />
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-700 mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className="content-card flex items-center gap-4 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
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
    </div>
  );
};