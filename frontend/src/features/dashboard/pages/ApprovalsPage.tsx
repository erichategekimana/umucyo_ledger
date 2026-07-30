import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cooperativeService } from '@/api/cooperative.service';
import { applicationsService, VetApplication } from '@/api/applications.service';
import { Cooperative, Farmer } from '@/types';
import { CheckCircle, XCircle, Clock, Building, User, Stethoscope } from 'lucide-react';

export const ApprovalsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'cooperatives' | 'vets' | 'farmers'>('farmers');
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [vets, setVets] = useState<VetApplication[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      setActiveTab('cooperatives');
      fetchSuperAdminData();
    } else if (user?.role === 'ADMIN') {
      setActiveTab('farmers');
      fetchAdminData();
    }
  }, [user]);

  const fetchSuperAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const coopData = await cooperativeService.listCooperatives();
      setCooperatives(coopData.results.filter((c: any) => c.status === 'PENDING'));
      
      const vetData = await applicationsService.listVetApplications();
      setVets(vetData.results.filter(v => v.status === 'PENDING'));
    } catch (e: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(e, 'Failed to fetch pending applications.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const farmerData = await cooperativeService.listFarmers();
      setFarmers(farmerData.results.filter(f => f.status === 'PENDING'));
    } catch (e: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(e, 'Failed to fetch pending applications.'));
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionFn: () => Promise<any>, refreshFn: () => Promise<void>) => {
    setError('');
    try {
      await actionFn();
      await refreshFn();
    } catch (e: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(e, 'Failed to process application.'));
    }
  };

  const handleApproveCoop = (id: string) => handleAction(() => cooperativeService.approveCooperative(id), fetchSuperAdminData);
  const handleDeclineCoop = (id: string) => handleAction(() => cooperativeService.declineCooperative(id), fetchSuperAdminData);
  const handleApproveVet = (id: string) => handleAction(() => applicationsService.approveVetApplication(id), fetchSuperAdminData);
  const handleDeclineVet = (id: string) => handleAction(() => applicationsService.declineVetApplication(id), fetchSuperAdminData);
  const handleApproveFarmer = (id: string) => handleAction(() => cooperativeService.approveFarmer(id), fetchAdminData);
  const handleDeclineFarmer = (id: string) => handleAction(() => cooperativeService.declineFarmer(id), fetchAdminData);

  if (loading) return <div className="p-8 text-center">Loading pending applications...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Pending Approvals</h1>
      
      {error && (
        <div className="alert-error flex items-center gap-2 text-sm bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 mb-6">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <button
              onClick={() => setActiveTab('cooperatives')}
              className={`pb-3 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'cooperatives' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building size={16} /> Cooperatives ({cooperatives.length})
            </button>
            <button
              onClick={() => setActiveTab('vets')}
              className={`pb-3 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'vets' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Stethoscope size={16} /> Veterinarians ({vets.length})
            </button>
          </>
        )}
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <button
            onClick={() => setActiveTab('farmers')}
            className={`pb-3 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'farmers' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={16} /> Farmers ({farmers.length})
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'cooperatives' && cooperatives.length === 0 && <p className="text-slate-500 text-center py-10">No pending cooperatives.</p>}
        {activeTab === 'cooperatives' && cooperatives.map(coop => (
          <div key={coop.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <h3 className="font-bold text-slate-900">{coop.name} <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{coop.district}</span></h3>
              <p className="text-sm text-slate-500 mt-1">Crop: {coop.crop} | Admin: {coop.admin_first_name} {coop.admin_last_name} ({coop.admin_phone})</p>
              <div className="flex gap-3 mt-3">
                {coop.certificate && <a href={coop.certificate as unknown as string} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">View Certificate</a>}
                {coop.tin_certificate && <a href={coop.tin_certificate as unknown as string} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">View TIN</a>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDeclineCoop(coop.id)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-2"><XCircle size={16} /> Decline</button>
              <button onClick={() => handleApproveCoop(coop.id)} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2"><CheckCircle size={16} /> Approve</button>
            </div>
          </div>
        ))}

        {activeTab === 'vets' && vets.length === 0 && <p className="text-slate-500 text-center py-10">No pending veterinarian applications.</p>}
        {activeTab === 'vets' && vets.map(vet => (
          <div key={vet.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <h3 className="font-bold text-slate-900">{vet.first_name} {vet.last_name} <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{vet.national_id}</span></h3>
              <p className="text-sm text-slate-500 mt-1">Email: {vet.email} | Phone: {vet.phone_number}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                {vet.national_id_document && <a href={vet.national_id_document} target="_blank" className="text-xs text-blue-600 hover:underline">ID Doc</a>}
                {vet.degree_certificate && <a href={vet.degree_certificate} target="_blank" className="text-xs text-blue-600 hover:underline">Degree</a>}
                {vet.transcripts && <a href={vet.transcripts} target="_blank" className="text-xs text-blue-600 hover:underline">Transcripts</a>}
                {vet.rcvd_certificate && <a href={vet.rcvd_certificate} target="_blank" className="text-xs text-blue-600 hover:underline">RCVD</a>}
                {vet.annual_practicing_license && <a href={vet.annual_practicing_license} target="_blank" className="text-xs text-blue-600 hover:underline">License</a>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDeclineVet(vet.id)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-2"><XCircle size={16} /> Decline</button>
              <button onClick={() => handleApproveVet(vet.id)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"><CheckCircle size={16} /> Approve</button>
            </div>
          </div>
        ))}

        {activeTab === 'farmers' && farmers.length === 0 && <p className="text-slate-500 text-center py-10">No pending farmer registrations.</p>}
        {activeTab === 'farmers' && farmers.map(farmer => (
          <div key={farmer.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <h3 className="font-bold text-slate-900">{farmer.full_name}</h3>
              <p className="text-sm text-slate-500 mt-1">Phone: {farmer.phone_number} | District: {farmer.district}</p>
              <p className="text-xs text-slate-400 mt-1">Applied to: {farmer.cooperative_name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDeclineFarmer(farmer.id)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-2"><XCircle size={16} /> Decline</button>
              <button onClick={() => handleApproveFarmer(farmer.id)} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2"><CheckCircle size={16} /> Approve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
