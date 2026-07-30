import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from '@/components/common/PrivateRoute';
import { AuthPage } from '@/features/auth/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ROUTES } from '@/config/routes';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Outlet } from 'react-router-dom';

// Dashboard pages
import { ApprovalsPage } from '@/features/dashboard/pages/ApprovalsPage';
import { RoleManagementPage } from '@/features/dashboard/pages/RoleManagementPage';

// Cooperative pages
import { CooperativeList } from '@/features/cooperatives/pages/CooperativeList';
import { CooperativeForm } from '@/features/cooperatives/pages/CooperativeForm';
import { StaffList } from '@/features/cooperatives/pages/StaffList';
import { StaffForm } from '@/features/cooperatives/pages/StaffForm';
import { FarmerList } from '@/features/cooperatives/pages/FarmerList';
import { FarmerForm } from '@/features/cooperatives/pages/FarmerForm';

// Harvest pages
import { BatchList } from '@/features/harvest/pages/BatchList';
import { DeliveryList } from '@/features/harvest/pages/DeliveryList';
import { DeliveryForm } from '@/features/harvest/pages/DeliveryForm';
import { AdjustmentList } from '@/features/harvest/pages/AdjustmentList';
import { DiscrepancyList } from '@/features/harvest/pages/DiscrepancyList';

// Sales pages
import { SaleList } from '@/features/sales/pages/SaleList';
import { SaleForm } from '@/features/sales/pages/SaleForm';
import { PayoutList } from '@/features/sales/pages/PayoutList';
import { AuditReport } from '@/features/sales/pages/AuditReport';

// Agronomy pages
import { AnomalyList } from '@/features/agronomy/pages/AnomalyList';
import { AnomalyForm } from '@/features/agronomy/pages/AnomalyForm';
import { AnomalyMap } from '@/features/agronomy/pages/AnomalyMap';

// Notification pages
import { NotificationList } from '@/features/notifications/pages/NotificationList';

// USSD logs
import { USSDLogList } from '@/features/ussd/pages/USSDLogList';

import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.LOGIN} element={<AuthPage />} />
        <Route path={ROUTES.REGISTER} element={<AuthPage />} />

        {/* All authenticated routes */}
        <Route element={<PrivateRoute><AppLayout><Outlet /></AppLayout></PrivateRoute>}>
          {/* Dashboard — all authenticated roles */}
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

          {/* Notifications — all roles */}
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationList />} />

          {/* Deliveries — Officers, Farmers, Managers, Admins, SuperAdmin */}
          <Route
            element={
              <PrivateRoute
                allowedRoles={['COLLECTION_OFFICER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN', 'FARMER']}
              />
            }
          >
            <Route path={ROUTES.DELIVERIES} element={<DeliveryList />} />
          </Route>

          {/* New delivery — Officers and above */}
          <Route
            element={
              <PrivateRoute
                allowedRoles={['COLLECTION_OFFICER', 'ADMIN', 'SUPER_ADMIN']}
              />
            }
          >
            <Route path={ROUTES.DELIVERY_NEW} element={<DeliveryForm />} />
          </Route>

          {/* Batches, Sales, Payouts — Managers and above */}
          <Route
            element={
              <PrivateRoute
                allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']}
              />
            }
          >
            <Route path={ROUTES.BATCHES} element={<BatchList />} />
            <Route path={ROUTES.SALES} element={<SaleList />} />
            <Route path={ROUTES.SALES_NEW} element={<SaleForm />} />
            <Route path={ROUTES.PAYOUTS} element={<PayoutList />} />
          </Route>

          {/* Admin & SuperAdmin only */}
          <Route
            element={
              <PrivateRoute
                allowedRoles={['ADMIN', 'SUPER_ADMIN']}
              />
            }
          >
            <Route path={ROUTES.APPROVALS} element={<ApprovalsPage />} />
            <Route path={ROUTES.ROLE_MANAGEMENT} element={<RoleManagementPage />} />
            <Route path={ROUTES.COOPERATIVES} element={<CooperativeList />} />
            <Route path={ROUTES.COOPERATIVE_NEW} element={<CooperativeForm />} />
            <Route path={ROUTES.COOPERATIVE_EDIT(':id')} element={<CooperativeForm />} />
            <Route path={ROUTES.STAFF} element={<StaffList />} />
            <Route path={ROUTES.STAFF_NEW} element={<StaffForm />} />
            <Route path={ROUTES.STAFF_EDIT(':id')} element={<StaffForm />} />
            <Route path={ROUTES.FARMERS} element={<FarmerList />} />
            <Route path={ROUTES.FARMER_NEW} element={<FarmerForm />} />
            <Route path={ROUTES.FARMER_EDIT(':id')} element={<FarmerForm />} />
            <Route path={ROUTES.ADJUSTMENTS} element={<AdjustmentList />} />
            <Route path={ROUTES.DISCREPANCIES} element={<DiscrepancyList />} />
            <Route path={ROUTES.AUDIT_REPORT} element={<AuditReport />} />
            <Route path={ROUTES.USSD_LOGS} element={<USSDLogList />} />
          </Route>

          {/* Veterinarian & above for agronomy */}
          <Route
            element={
              <PrivateRoute
                allowedRoles={['VETERINARIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']}
              />
            }
          >
            <Route path={ROUTES.ANOMALIES} element={<AnomalyList />} />
            <Route path={ROUTES.ANOMALY_NEW} element={<AnomalyForm />} />
            <Route path={ROUTES.ANOMALY_EDIT(':id')} element={<AnomalyForm />} />
            <Route path={ROUTES.ANOMALY_MAP} element={<AnomalyMap />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;