import React, { useState } from 'react';
import { cooperativeService } from '@/api/cooperative.service';
import { RWANDA_DISTRICTS } from '@/utils/constants';
import { Building, MapPin, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CooperativeRegistrationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    preferred_name: '',
    district: '',
    sector: '',
    crop: 'Coffee',
    admin_first_name: '',
    admin_last_name: '',
    admin_phone: '',
  });
  const [files, setFiles] = useState<{ certificate: File | null; tin_certificate: File | null }>({
    certificate: null,
    tin_certificate: null
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [e.target.name]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.name.length <= 4) {
      setError("Cooperative full name must be longer than 4 letters.");
      return;
    }
    
    if (!files.certificate || !files.tin_certificate) {
      setError("Both RCA Certificate and TIN Certificate are required.");
      return;
    }
    
    setIsSubmitting(true);
    
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append('certificate', files.certificate);
    data.append('tin_certificate', files.tin_certificate);
    
    try {
      await cooperativeService.createCooperative(data);
      setSuccess(true);
      setTimeout(onSuccess, 3000);
    } catch (err: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(err, 'An error occurred during submission.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Application Submitted!</h3>
        <p className="text-slate-500 text-sm">
          Your cooperative registration has been sent to RCA Super Admin for review.
          You will be notified once it is approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
      {error && (
        <div className="alert-error flex items-center gap-2 text-sm bg-red-50 text-red-600 p-3 rounded-lg border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 border-b pb-1">Cooperative Details</h3>
        
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Cooperative Full Name</label>
          <input type="text" name="name" required minLength={5} value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" placeholder="e.g. Abahizi Cooperative Ltd" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Preferred Name (Optional)</label>
            <input type="text" name="preferred_name" value={formData.preferred_name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" placeholder="Short name" />
          </div>
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Primary Crop</label>
            <input type="text" name="crop" required value={formData.crop} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" placeholder="e.g. Coffee" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">District</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select name="district" required value={formData.district} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none appearance-none">
                <option value="">Select District</option>
                {RWANDA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Sector</label>
            <input type="text" name="sector" required value={formData.sector} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" placeholder="e.g. Kacyiru" />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-800 border-b pb-1">Admin Applicant Details</h3>
        <p className="text-xs text-slate-500">This person will become the Cooperative Admin upon approval.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Admin First Name</label>
            <input type="text" name="admin_first_name" required value={formData.admin_first_name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" placeholder="First name" />
          </div>
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Admin Last Name</label>
            <input type="text" name="admin_last_name" required value={formData.admin_last_name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" placeholder="Last name" />
          </div>
        </div>
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Admin Phone</label>
          <input type="tel" name="admin_phone" required value={formData.admin_phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" placeholder="+250780000000" />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-800 border-b pb-1">Legal Documents</h3>
        
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">RCA Certificate of Association (PDF)</label>
          <div className="relative">
            <input type="file" name="certificate" accept=".pdf" required onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
          </div>
        </div>
        
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">TIN Certificate (PDF/PNG)</label>
          <div className="relative">
            <input type="file" name="tin_certificate" accept=".pdf,.png,.jpeg,.jpg" required onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4">
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Submitting...
          </span>
        ) : (
          <><Building size={18} /> Submit Application</>
        )}
      </button>
    </form>
  );
};
