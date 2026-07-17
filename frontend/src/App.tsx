import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import type { UserRole } from './types';
import { Scale, DollarSign, MapPin, FileSpreadsheet, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [role] = useState<UserRole>('SUPER_ADMIN');
  const [language, setLanguage] = useState<'en' | 'rw'>('en');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'harvest':
        return (
          <div className="glass-card p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mx-auto text-primary-400">
              <Scale className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">Harvest Ledger Domain View</h3>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Full append-only delivery logs, bottom-up BatchTotal aggregation, and administrative AdjustmentLog tracking with <code className="text-primary-400 bg-slate-900 px-1.5 py-0.5 rounded">effective_weight_kg</code> computation.
            </p>
          </div>
        );
      case 'sales':
        return (
          <div className="glass-card p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <DollarSign className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">Bulk Sales & Algorithmic Revenue Split</h3>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Wholesale contract management, bank transfer verification (<code className="text-purple-400 bg-slate-900 px-1.5 py-0.5 rounded">FR 5.2</code>), and proportional farmer payout allocations with <code className="text-purple-400 bg-slate-900 px-1.5 py-0.5 rounded">PaymentStatus.PAID</code> disbursement tracking.
            </p>
          </div>
        );
      case 'agronomy':
        return (
          <div className="glass-card p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">Agronomic & Veterinary GIS Map</h3>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              High-precision GIS coordinate alerts (<code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">±10cm</code>), severity grading (<code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">LOW</code> to <code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">CRITICAL</code>), and rapid outbreak resolution workflows (<code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">FR 7.x</code>).
            </p>
          </div>
        );
      case 'audit':
        return (
          <div className="glass-card p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">RCA Regulatory Audit Export</h3>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Cryptographic financial export summary mapping every delivery, sale, and payout line for submission to the Rwanda Cooperative Agency (<code className="text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded">FR 6.2</code>).
            </p>
          </div>
        );
      case 'ussd':
        return (
          <div className="glass-card p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Terminal className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">Africa's Talking USSD Gateway (*789#)</h3>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Real-time protocol handler monitoring <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">CON</code> and <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">END</code> session latency (<code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">&lt; 20s telco limit</code>) across Kinyarwanda and English farmer queries.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          role={role} 
          language={language} 
          onLanguageChange={setLanguage}
          coopName="Koperative Umucyo w'Abahinzi (Kigali Sector)"
        />

        <main className="flex-1 px-8 py-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
