import { AppLayout } from '@/components/layouts/AppLayout';
import { DashboardRouter } from '@/features/dashboard/pages/DashboardRouter';

export const DashboardPage = () => {
  return (
    <AppLayout>
      <DashboardRouter />
    </AppLayout>
  );
};