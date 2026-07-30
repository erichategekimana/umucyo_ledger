import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 px-16 py-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 7v10M3 7l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white text-xl font-bold">Umucyo Ledger</span>
          </div>

          <h1 className="text-white text-4xl font-extrabold leading-tight mb-4">
            Agricultural<br />
            <span className="text-emerald-400">Cooperative</span><br />
            Management
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            A complete digital platform for managing Rwanda's agricultural cooperatives — from field to payout.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: '🌿', label: 'Crop Delivery Tracking', desc: 'Log and monitor every delivery in real time' },
            { icon: '💳', label: 'Revenue Distribution', desc: 'Automated fair payout calculation for farmers' },
            { icon: '📊', label: 'Harvest Analytics', desc: 'Insights across cooperatives, seasons, and crops' },
          ].map((feature) => (
            <div key={feature.label} className="flex items-start gap-3">
              <span className="text-2xl">{feature.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{feature.label}</p>
                <p className="text-slate-400 text-xs">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
};