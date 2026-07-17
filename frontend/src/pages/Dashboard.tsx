import React, { useState } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  Plus, 
  Search, 
  Filter, 
  FileCheck,
  ShieldAlert,
  Calendar,
  UserCheck
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import type { CropDelivery } from '../types';

export const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('all');

  const mockDeliveries: CropDelivery[] = [
    {
      id: 'd-101',
      cooperative: 'Koperative Umucyo w\'Abahinzi',
      farmer: 'Jean Baptiste Habimana (ID: ...0001)',
      officer: 'Collection Officer (#C-04)',
      crop_type: 'soya',
      weight_kg: 340.00,
      dropoff_time: '2026-07-17 05:26:00',
    },
    {
      id: 'd-102',
      cooperative: 'Koperative Umucyo w\'Abahinzi',
      farmer: 'Marie Claire Uwase (ID: ...0002)',
      officer: 'Collection Officer (#C-04)',
      crop_type: 'soya',
      weight_kg: 125.50,
      dropoff_time: '2026-07-17 05:25:30',
    },
    {
      id: 'd-103',
      cooperative: 'Koperative Umucyo w\'Abahinzi',
      farmer: 'Paul Nshuti (ID: ...0003)',
      officer: 'Collection Officer (#C-04)',
      crop_type: 'soya',
      weight_kg: 89.25,
      dropoff_time: '2026-07-17 05:24:15',
    },
    {
      id: 'd-104',
      cooperative: 'Koperative Umucyo w\'Abahinzi',
      farmer: 'Emmanuel Mugisha (ID: ...0004)',
      officer: 'Collection Officer (#C-02)',
      crop_type: 'coffee',
      weight_kg: 450.00,
      dropoff_time: '2026-07-16 16:10:00',
    },
  ];

  const filteredDeliveries = mockDeliveries.filter(d => {
    const matchesSearch = d.farmer.toLowerCase().includes(searchTerm.toLowerCase()) || d.crop_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = cropFilter === 'all' || d.crop_type === cropFilter;
    return matchesSearch && matchesCrop;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 to-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30">
              Season 2026-A Active
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary-400" /> July 17, 2026
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
            Cooperative Harvest & Audit Control
          </h2>
          <p className="text-sm text-slate-400">
            Monitor real-time append-only field entries, batch totals, and algorithmic revenue split disbursements.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-primary-400" />
            <span>Lock Batch for Sale</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Field Drop-off</span>
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Season Harvest"
          value="554.75 kg"
          subtitle="Aggregated via PostgreSQL SUM()"
          badgeText="+14.2% vs last week"
          badgePositive={true}
          icon={Scale}
        />
        <StatCard
          title="Active Harvest Batch"
          value="Soya (OPEN)"
          subtitle="3 Deliveries Linked"
          badgeText="Locked at 1,000 kg"
          badgePositive={true}
          icon={CheckCircle2}
          iconBg="from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400"
        />
        <StatCard
          title="Wholesale Payout Pool"
          value="1.00M RWF"
          subtitle="Bank Transfer Verified"
          badgeText="Exact Proportional Split"
          badgePositive={true}
          icon={Coins}
          iconBg="from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400"
        />
        <StatCard
          title="Agronomy GIS Alerts"
          value="1 Active"
          subtitle="Soya Leaf Blight @ Kigali Sector"
          badgeText="Critical Priority"
          badgePositive={false}
          icon={AlertTriangle}
          iconBg="from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400"
        />
      </div>

      {/* Append-Only Harvest Ledger Section */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
              Recent Harvest Deliveries (The Fraud Block)
            </h3>
            <p className="text-xs text-slate-400">
              Every drop-off is write-once and protected against update/delete modifications at the database schema layer.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search farmer name or crop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all w-64"
              />
            </div>

            <div className="relative flex items-center">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
              >
                <option value="all">All Crops</option>
                <option value="soya">Soya</option>
                <option value="coffee">Coffee</option>
                <option value="maize">Maize</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs uppercase tracking-wider text-slate-400 font-semibold bg-slate-950/40">
                <th className="py-3.5 px-4 rounded-l-xl">Farmer & National ID</th>
                <th className="py-3.5 px-4">Crop Type</th>
                <th className="py-3.5 px-4">Captured Weight (kg)</th>
                <th className="py-3.5 px-4">Drop-off Timestamp</th>
                <th className="py-3.5 px-4">Collection Officer</th>
                <th className="py-3.5 px-4 rounded-r-xl">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredDeliveries.map((d) => (
                <tr key={d.id} className="hover:bg-slate-900/50 transition-colors group">
                  <td className="py-4 px-4 font-medium text-slate-200 flex items-center space-x-2.5">
                    <UserCheck className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <span>{d.farmer}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 uppercase">
                      {d.crop_type}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-base text-primary-400">
                    {d.weight_kg.toFixed(2)} <span className="text-xs text-slate-400 font-normal">kg</span>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-400">
                    {d.dropoff_time}
                  </td>
                  <td className="py-4 px-4 text-slate-300 text-xs">
                    {d.officer}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-500/15 text-primary-300 border border-primary-500/30">
                      <ShieldAlert className="w-3.5 h-3.5 text-primary-400" />
                      <span>Append-Only Lock</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
