import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cooperativeService } from '@/api/cooperative.service';
import { Cooperative } from '@/types';
import { RWANDA_DISTRICTS } from '@/utils/constants';
import { Eye, EyeOff, UserPlus, Building, MapPin, AlertCircle } from 'lucide-react';

export const FarmerRegistrationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [district, setDistrict] = useState('');
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loadingCoops, setLoadingCoops] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: '',
    cooperative_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    if (district) {
      setLoadingCoops(true);
      cooperativeService.getApprovedCooperatives(district)
        .then(data => setCooperatives(data))
        .catch(() => setError('Failed to load cooperatives'))
        .finally(() => setLoadingCoops(false));
    } else {
      setCooperatives([]);
    }
  }, [district]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await register({
        username: formData.phone_number, // User will log in with phone
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        role: 'FARMER',
        // @ts-ignore
        first_name: formData.first_name,
        last_name: formData.last_name,
        district: district,
        cooperative_id: formData.cooperative_id,
      });
      onSuccess();
    } catch (err: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(err, 'An error occurred during registration.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error && (
        <div className="alert-error flex items-center gap-2 text-sm bg-red-50 text-red-600 p-3 rounded-lg border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">First Name</label>
          <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="John" />
        </div>
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Last Name</label>
          <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="Doe" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">District</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select required value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none appearance-none">
              <option value="">Select District</option>
              {RWANDA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Cooperative</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select name="cooperative_id" required value={formData.cooperative_id} onChange={handleChange} disabled={!district || loadingCoops} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none appearance-none disabled:opacity-50">
              <option value="">{loadingCoops ? 'Loading...' : 'Select Cooperative'}</option>
              {cooperatives.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Phone Number</label>
        <input type="tel" name="phone_number" required value={formData.phone_number} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="+250780000000" />
      </div>

      <div className="form-group">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Email (Optional)</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="you@example.com" />
      </div>

      <div className="form-group">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="••••••••" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Registering...
          </span>
        ) : (
          <><UserPlus size={18} /> Register as Farmer</>
        )}
      </button>
    </form>
  );
};
