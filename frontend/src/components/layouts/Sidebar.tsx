import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';

const roleMenuMap: Record<Role, Array<{ to: string; label: string }>> = {
SUPER_ADMIN: [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.COOPERATIVES, label: 'Cooperatives' },
  { to: ROUTES.STAFF, label: 'Staff' },
  { to: ROUTES.FARMERS, label: 'Farmers' },
  { to: ROUTES.BATCHES, label: 'Batches' },
  { to: ROUTES.DELIVERIES, label: 'Deliveries' },
  { to: ROUTES.SALES, label: 'Sales' },
  { to: ROUTES.PAYOUTS, label: 'Payouts' },
  { to: ROUTES.AUDIT_REPORT, label: 'Audit Report' },
  { to: ROUTES.DISCREPANCIES, label: 'Discrepancies' },
  { to: ROUTES.USSD, label: 'USSD Logs' },
  { to: ROUTES.ANOMALIES, label: 'Anomaly Reports' },
  { to: ROUTES.NOTIFICATIONS, label: 'Notifications' },
  { to: ROUTES.USSD_LOGS, label: 'USSD Logs' },
],
ADMIN: [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.COOPERATIVES, label: 'Cooperatives' },
  { to: ROUTES.STAFF, label: 'Staff' },
  { to: ROUTES.FARMERS, label: 'Farmers' },
  { to: ROUTES.BATCHES, label: 'Batches' },
  { to: ROUTES.DELIVERIES, label: 'Deliveries' },
  { to: ROUTES.ADJUSTMENTS, label: 'Adjustments' },
  { to: ROUTES.SALES, label: 'Sales' },
  { to: ROUTES.PAYOUTS, label: 'Payouts' },
  { to: ROUTES.ANOMALIES, label: 'Anomaly Reports' },
  { to: ROUTES.NOTIFICATIONS, label: 'Notifications' },
  { to: ROUTES.USSD_LOGS, label: 'USSD Logs' },
],
MANAGER: [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.BATCHES, label: 'Batches' },
  { to: ROUTES.DELIVERIES, label: 'Deliveries' },
  { to: ROUTES.SALES, label: 'Sales' },
  { to: ROUTES.PAYOUTS, label: 'Payouts' },
  { to: ROUTES.NOTIFICATIONS, label: 'Notifications' },
],
  COLLECTION_OFFICER: [
    { to: ROUTES.DASHBOARD, label: 'Dashboard' },
    { to: ROUTES.DELIVERIES, label: 'Deliveries' },
    { to: ROUTES.DELIVERY_NEW, label: 'New Delivery' },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications' },
  ],
  VETERINARIAN: [
    { to: ROUTES.DASHBOARD, label: 'Dashboard' },
    { to: ROUTES.AGRONOMY, label: 'Health Reports' },
    { to: ROUTES.ANOMALIES, label: 'Anomaly Reports' },
    { to: ROUTES.ANOMALY_MAP, label: 'Map View' },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications' },
  ],
  FARMER: [
    { to: ROUTES.DASHBOARD, label: 'My Dashboard' },
    { to: ROUTES.DELIVERIES, label: 'My Deliveries' },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications' },
  ],
};

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar = ({ collapsed }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role as Role;
  const menuItems = role ? roleMenuMap[role] || [] : [];

  return (
    <aside className={`bg-white shadow-md transition-all ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4">
        {!collapsed && <h2 className="text-lg font-bold">Umucyo Ledger</h2>}
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`block px-4 py-2 hover:bg-gray-200 ${
              location.pathname === item.to ? 'bg-gray-100 font-semibold' : ''
            }`}
          >
            {collapsed ? item.label[0] : item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};