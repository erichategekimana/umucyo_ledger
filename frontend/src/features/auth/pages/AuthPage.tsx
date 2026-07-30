import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { ROUTES } from '@/config/routes';
import { LogIn, UserPlus, Building, Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { FarmerRegistrationForm } from '../components/FarmerRegistrationForm';
import { CooperativeRegistrationForm } from '../components/CooperativeRegistrationForm';
import { VeterinarianRegistrationForm } from '../components/VeterinarianRegistrationForm';

export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'farmer' | 'coop' | 'vet'>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(err, 'Incorrect login info or server error.'));
    }
  };

  const handleRegistrationSuccess = () => {
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-white border-r border-slate-200 hidden md:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M12 7v10M3 7l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">Umucyo Ledger</span>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('login')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'login' 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LogIn size={18} className={activeTab === 'login' ? 'text-emerald-500' : 'text-slate-400'} />
            Sign In
          </button>
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Registration</p>
          </div>

          <button
            onClick={() => setActiveTab('farmer')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'farmer' 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserPlus size={18} className={activeTab === 'farmer' ? 'text-emerald-500' : 'text-slate-400'} />
            Join as Farmer
          </button>

          <button
            onClick={() => setActiveTab('coop')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'coop' 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building size={18} className={activeTab === 'coop' ? 'text-emerald-500' : 'text-slate-400'} />
            Register Cooperative
          </button>

          <button
            onClick={() => setActiveTab('vet')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'vet' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Stethoscope size={18} className={activeTab === 'vet' ? 'text-blue-500' : 'text-slate-400'} />
            Veterinarian Application
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
        {/* Mobile Tabs */}
        <div className="md:hidden w-full max-w-md mb-6 overflow-x-auto pb-2 flex gap-2 no-scrollbar">
           <button onClick={() => setActiveTab('login')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium ${activeTab === 'login' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 border'}`}>Sign In</button>
           <button onClick={() => setActiveTab('farmer')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium ${activeTab === 'farmer' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 border'}`}>Farmer</button>
           <button onClick={() => setActiveTab('coop')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium ${activeTab === 'coop' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 border'}`}>Cooperative</button>
           <button onClick={() => setActiveTab('vet')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium ${activeTab === 'vet' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 border'}`}>Veterinarian</button>
        </div>

        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'login' && 'Welcome back'}
              {activeTab === 'farmer' && 'Create Farmer Account'}
              {activeTab === 'coop' && 'Register Cooperative'}
              {activeTab === 'vet' && 'Veterinarian Application'}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {activeTab === 'login' && 'Sign in to access your dashboard and manage your data.'}
              {activeTab === 'farmer' && 'Join an approved cooperative to start logging your deliveries.'}
              {activeTab === 'coop' && 'Submit your cooperative details for RCA approval.'}
              {activeTab === 'vet' && 'Apply for extension officer access with valid credentials.'}
            </p>
          </div>

          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {error && (
                <div className="alert-error flex items-center gap-2 text-sm bg-red-50 text-red-600 p-3 rounded-lg border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="form-group">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Phone or Username</label>
                <input
                  type="text"
                  placeholder="Enter your phone number"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              
              <div className="form-group">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <><LogIn size={18} /> Sign In</>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'farmer' && <FarmerRegistrationForm onSuccess={handleRegistrationSuccess} />}
          {activeTab === 'coop' && <CooperativeRegistrationForm onSuccess={handleRegistrationSuccess} />}
          {activeTab === 'vet' && <VeterinarianRegistrationForm onSuccess={handleRegistrationSuccess} />}

        </div>
        
        {/* Decorative background blur */}
        <div className="fixed top-0 right-0 -z-10 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[100px]" />
        </div>
      </div>
    </div>
  );
};