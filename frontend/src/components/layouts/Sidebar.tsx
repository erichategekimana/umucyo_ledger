import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';
import {
  LayoutDashboard, Building2, Users, UserCheck, Layers, Truck, ShoppingCart,
  DollarSign, FileBarChart, AlertTriangle, Map, Bell, Radio, ScrollText,
  ChevronLeft, ChevronRight, Stethoscope, Plus, Settings
} from 'lucide-react';

interface MenuItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const roleMenuMap: Record<Role, MenuItem[]> = {
  SUPER_ADMIN: [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: ROUTES.COOPERATIVES, label: 'Cooperatives', icon: <Building2 size={18} /> },
    { to: ROUTES.STAFF, label: 'Staff', icon: <UserCheck size={18} /> },
    { to: ROUTES.FARMERS, label: 'Farmers', icon: <Users size={18} /> },
    { to: ROUTES.BATCHES, label: 'Batches', icon: <Layers size={18} /> },
    { to: ROUTES.DELIVERIES, label: 'Deliveries', icon: <Truck size={18} /> },
    { to: ROUTES.SALES, label: 'Sales', icon: <ShoppingCart size={18} /> },
    { to: ROUTES.PAYOUTS, label: 'Payouts', icon: <DollarSign size={18} /> },
    { to: ROUTES.AUDIT_REPORT, label: 'Audit Report', icon: <FileBarChart size={18} /> },
    { to: ROUTES.ANOMALIES, label: 'Anomalies', icon: <AlertTriangle size={18} /> },
    { to: ROUTES.ANOMALY_MAP, label: 'Anomaly Map', icon: <Map size={18} /> },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: <Bell size={18} /> },
    { to: ROUTES.USSD_LOGS, label: 'USSD Logs', icon: <Radio size={18} /> },
  ],
  ADMIN: [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: ROUTES.COOPERATIVES, label: 'Cooperatives', icon: <Building2 size={18} /> },
    { to: ROUTES.STAFF, label: 'Staff', icon: <UserCheck size={18} /> },
    { to: ROUTES.FARMERS, label: 'Farmers', icon: <Users size={18} /> },
    { to: ROUTES.BATCHES, label: 'Batches', icon: <Layers size={18} /> },
    { to: ROUTES.DELIVERIES, label: 'Deliveries', icon: <Truck size={18} /> },
    { to: ROUTES.ADJUSTMENTS, label: 'Adjustments', icon: <ScrollText size={18} /> },
    { to: ROUTES.SALES, label: 'Sales', icon: <ShoppingCart size={18} /> },
    { to: ROUTES.PAYOUTS, label: 'Payouts', icon: <DollarSign size={18} /> },
    { to: ROUTES.ANOMALIES, label: 'Anomalies', icon: <AlertTriangle size={18} /> },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: <Bell size={18} /> },
    { to: ROUTES.USSD_LOGS, label: 'USSD Logs', icon: <Radio size={18} /> },
  ],
  MANAGER: [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: ROUTES.BATCHES, label: 'Batches', icon: <Layers size={18} /> },
    { to: ROUTES.DELIVERIES, label: 'Deliveries', icon: <Truck size={18} /> },
    { to: ROUTES.SALES, label: 'Sales', icon: <ShoppingCart size={18} /> },
    { to: ROUTES.PAYOUTS, label: 'Payouts', icon: <DollarSign size={18} /> },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: <Bell size={18} /> },
  ],
  COLLECTION_OFFICER: [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: ROUTES.DELIVERIES, label: 'All Deliveries', icon: <Truck size={18} /> },
    { to: ROUTES.DELIVERY_NEW, label: 'Log Delivery', icon: <Plus size={18} /> },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: <Bell size={18} /> },
  ],
  VETERINARIAN: [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: ROUTES.ANOMALIES, label: 'Anomaly Reports', icon: <AlertTriangle size={18} /> },
    { to: ROUTES.ANOMALY_MAP, label: 'Map View', icon: <Map size={18} /> },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: <Bell size={18} /> },
  ],
  FARMER: [
    { to: ROUTES.DASHBOARD, label: 'My Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: ROUTES.DELIVERIES, label: 'My Deliveries', icon: <Truck size={18} /> },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: <Bell size={18} /> },
  ],
};

const roleMeta: Record<Role, { label: string; color: string; icon: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-500/20 text-purple-300', icon: '⚡' },
  ADMIN: { label: 'Admin', color: 'bg-blue-500/20 text-blue-300', icon: '🏢' },
  MANAGER: { label: 'Manager', color: 'bg-emerald-500/20 text-emerald-300', icon: '📋' },
  COLLECTION_OFFICER: { label: 'Officer', color: 'bg-amber-500/20 text-amber-300', icon: '📦' },
  VETERINARIAN: { label: 'Veterinarian', color: 'bg-cyan-500/20 text-cyan-300', icon: '🩺' },
  FARMER: { label: 'Farmer', color: 'bg-green-500/20 text-green-300', icon: '🌾' },
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role as Role;
  const menuItems = role ? roleMenuMap[role] || [] : [];
  const meta = role ? roleMeta[role] : null;

  return (
    <aside
      className={`relative flex flex-col h-full bg-slate-900 text-white transition-all duration-300 shadow-xl
        ${collapsed ? 'w-[72px]' : 'w-64'}`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M12 7v10M3 7l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div className="font-extrabold text-white leading-tight">Umucyo Ledger</div>
            <div className="text-xs text-slate-500">Cooperative Platform</div>
          </div>
        )}
      </div>

      {/* User pill */}
      {meta && !collapsed && (
        <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-base">
              {meta.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${meta.color}`}>
                {meta.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}`}
            >
              <span className={`shrink-0 ${isActive ? 'text-emerald-400' : ''}`}>{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge != null && item.badge > 0 && (
                <span className="ml-auto text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-800 p-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-slate-500
            hover:bg-slate-800 hover:text-white transition-all text-sm"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
};