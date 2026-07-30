import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cooperativeService } from '@/api/cooperative.service';
import { Cooperative, CooperativeStaff, Farmer } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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
        // Cooperative ID is embedded in JWT (cooperative_id), but we don't have it in User type.
        // We'll fetch the cooperative by user's staff profile or from the list.
        // For simplicity, we'll assume the user has a staff profile and we'll get their cooperative.
        // Alternative: we can get the cooperative from the user's staff profile by calling /staff/?user={user.id}
        // We'll just list cooperatives and pick the first one? Not robust.
        // Better: we'll fetch the user's staff profile or farmer profile.
        // Since we have the user's cooperative_id in the JWT token, we could decode it, but let's keep it simple:
        // For this demo, we'll fetch all cooperatives and pick the first? Not good.
        // Let's assume the Admin user is linked to a cooperative via CooperativeStaff.
        // We'll fetch staff profiles for this user.
        const staffResp = await cooperativeService.listStaff({ user: user.id, page_size: 1 });
        const staff = staffResp.results[0];
        if (staff) {
          const coopResp = await cooperativeService.getCooperative(staff.cooperative);
          setCooperative(coopResp);
        }

        // Count staff and farmers for this cooperative
        if (staff) {
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cooperative Admin Dashboard</h1>
      {cooperative && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">{cooperative.name}</h2>
          <p className="text-sm text-gray-600">District: {cooperative.district}, Sector: {cooperative.sector}</p>
          <p className="text-sm text-gray-600">Registration: {cooperative.rca_registration_no}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Staff Members" value={staffCount} />
        <StatCard title="Farmers" value={farmerCount} />
      </div>
    </div>
  );
};