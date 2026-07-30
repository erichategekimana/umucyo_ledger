import { useAuth } from '@/hooks/useAuth';
import { FarmerDashboard } from './FarmerDashboard';
import { CollectionOfficerDashboard } from './CollectionOfficerDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { AdminDashboard } from './AdminDashboard';
import { VeterinarianDashboard } from './VeterinarianDashboard';
import { SuperAdminDashboard } from './SuperAdminDashboard';

export const DashboardRouter = () => {
  const { user } = useAuth();
  const role = user?.role;

  switch (role) {
    case 'FARMER':
      return <FarmerDashboard />;
    case 'COLLECTION_OFFICER':
      return <CollectionOfficerDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    case 'VETERINARIAN':
      return <VeterinarianDashboard />;
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    default:
      return <div>Unrecognized role</div>;
  }
};