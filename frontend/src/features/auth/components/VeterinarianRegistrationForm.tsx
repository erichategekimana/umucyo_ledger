import React, { useState } from 'react';
import { applicationsService } from '@/api/applications.service';
import { Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';

export const VeterinarianRegistrationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    national_id: '',
    is_rwandan: 'true',
  });
  
  const [files, setFiles] = useState<{
    national_id_document: File | null;
    degree_certificate: File | null;
    transcripts: File | null;
    proof_of_internship: File | null;
    rcvd_certificate: File | null;
    annual_practicing_license: File | null;
  }>({
    national_id_document: null,
    degree_certificate: null,
    transcripts: null,
    proof_of_internship: null,
    rcvd_certificate: null,
    annual_practicing_license: null,
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
    
    // Check all files
    for (const [key, file] of Object.entries(files)) {
      if (!file) {
        setError(`Please upload your ${key.replace(/_/g, ' ')}`);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    Object.entries(files).forEach(([key, file]) => {
      if (file) data.append(key, file);
    });
    
    try {
      await applicationsService.submitVetApplication(data);
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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Application Submitted!</h3>
        <p className="text-slate-500 text-sm">
          Your Veterinarian application has been sent to the RCA Super Admin for verification.
          You will receive an email once it is approved.
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
        <h3 className="text-sm font-bold text-slate-800 border-b pb-1">Personal Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">First Name</label>
            <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
          </div>
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Last Name</label>
            <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
          </div>
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Phone Number</label>
            <input type="tel" name="phone_number" required value={formData.phone_number} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">National ID / Passport</label>
            <input type="text" name="national_id" required value={formData.national_id} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
          </div>
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Nationality</label>
            <select name="is_rwandan" required value={formData.is_rwandan} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none">
              <option value="true">Rwandan</option>
              <option value="false">Foreigner</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-800 border-b pb-1">Core Legal Requirements (PDF)</h3>
        
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">National ID or Passport Copy</label>
          <input type="file" name="national_id_document" accept=".pdf,.png,.jpg" required onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Degree</label>
          <input type="file" name="degree_certificate" accept=".pdf" required onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Transcripts</label>
          <input type="file" name="transcripts" accept=".pdf" required onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Proof of Structural Internship or Practice Validation</label>
          <input type="file" name="proof_of_internship" accept=".pdf" required onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
      </div>
      
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-800 border-b pb-1">Digital Application & Licensing Steps</h3>
        
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Certificate of Registration (The Roll Certificate) from RCVD</label>
          <input type="file" name="rcvd_certificate" accept=".pdf" required onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        
        <div className="form-group">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Annual Practicing License</label>
          <input type="file" name="annual_practicing_license" accept=".pdf" required onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4">
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Submitting...
          </span>
        ) : (
          <><Stethoscope size={18} /> Submit Application</>
        )}
      </button>
    </form>
  );
};
