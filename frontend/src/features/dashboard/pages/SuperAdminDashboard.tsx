import { useEffect, useState } from 'react';
import { cooperativeService } from '@/api/cooperative.service';
import { harvestService } from '@/api/harvest.service';
import { agronomyService } from '@/api/agronomy.service';
import { StatCard } from '@/components/common/StatCard';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [coopCount, setCoopCount] = useState(0);
  const [farmerCount, setFarmerCount] = useState(0);
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [unresolvedDisc, setUnresolvedDisc] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cooperatives = await cooperativeService.listCooperatives({ page_size: 1 });
        setCoopCount(cooperatives.count);

        // Farmers count across all
        const farmers = await cooperativeService.listFarmers({ page_size: 1 });
        setFarmerCount(farmers.count);

        // Discrepancies
        const discResp = await harvestService.listDiscrepancies({ resolved: false, page_size: 5 });
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

  const activities = discrepancies.map(d => ({
    id: d.id,
    title: `Discrepancy: ${d.batch_details.crop_type} - ${d.batch_details.cooperative}`,
    description: `Ledger: ${d.ledger_weight_kg}kg, Invoice: ${d.invoice_weight_kg}kg, Drift: ${d.drift_kg}kg`,
    timestamp: d.created_at,
  }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Cooperatives" value={coopCount} />
        <StatCard title="Total Farmers" value={farmerCount} />
        <StatCard title="Unresolved Discrepancies" value={unresolvedDisc} />
      </div>
      <ActivityFeed activities={activities} title="Recent Discrepancies" />
    </div>
  );
};