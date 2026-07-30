#!/bin/bash
set -e  # stop on error

echo "Creating Umucyo Ledger frontend structure..."

# ----------------------------------------------------------------------
# 1. Top-level directories
# ----------------------------------------------------------------------
mkdir -p src/api
mkdir -p src/assets
mkdir -p src/components/common
mkdir -p src/components/layouts
mkdir -p src/components/shared
mkdir -p src/config
mkdir -p src/contexts
mkdir -p src/features/auth/{components,hooks,pages,services}
mkdir -p src/features/dashboard/{components,hooks,pages,services}
mkdir -p src/features/cooperatives/{components,hooks,pages,services}
mkdir -p src/features/harvest/{components,hooks,pages,services}
mkdir -p src/features/sales/{components,hooks,pages,services}
mkdir -p src/features/agronomy/{components,hooks,pages,services}
mkdir -p src/features/notifications/{components,hooks,pages,services}
mkdir -p src/features/ussd/{components,hooks,pages,services}
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/pages
mkdir -p src/store
mkdir -p src/styles
mkdir -p src/types
mkdir -p src/utils

# ----------------------------------------------------------------------
# 2. Files inside api/
# ----------------------------------------------------------------------
touch src/api/client.ts
touch src/api/endpoints.ts
touch src/api/auth.service.ts
touch src/api/user.service.ts
touch src/api/cooperative.service.ts
touch src/api/harvest.service.ts
touch src/api/sales.service.ts
touch src/api/agronomy.service.ts
touch src/api/notification.service.ts
touch src/api/base.service.ts

# ----------------------------------------------------------------------
# 3. Files inside config/
# ----------------------------------------------------------------------
touch src/config/routes.ts
touch src/config/constants.ts

# ----------------------------------------------------------------------
# 4. Files inside contexts/
# ----------------------------------------------------------------------
touch src/contexts/AuthContext.tsx

# ----------------------------------------------------------------------
# 5. Feature modules – placeholder .gitkeep files
# ----------------------------------------------------------------------
# auth
touch src/features/auth/components/.gitkeep
touch src/features/auth/hooks/.gitkeep
touch src/features/auth/pages/.gitkeep
touch src/features/auth/services/.gitkeep

# dashboard (has specific page files)
touch src/features/dashboard/components/.gitkeep
touch src/features/dashboard/hooks/.gitkeep
touch src/features/dashboard/pages/DashboardRouter.tsx
touch src/features/dashboard/pages/FarmerDashboard.tsx
touch src/features/dashboard/pages/CollectionOfficerDashboard.tsx
touch src/features/dashboard/pages/ManagerDashboard.tsx
touch src/features/dashboard/pages/AdminDashboard.tsx
touch src/features/dashboard/pages/VeterinarianDashboard.tsx
touch src/features/dashboard/pages/SuperAdminDashboard.tsx
touch src/features/dashboard/services/.gitkeep

# cooperatives
touch src/features/cooperatives/components/.gitkeep
touch src/features/cooperatives/hooks/.gitkeep
touch src/features/cooperatives/pages/.gitkeep
touch src/features/cooperatives/services/.gitkeep

# harvest
touch src/features/harvest/components/.gitkeep
touch src/features/harvest/hooks/.gitkeep
touch src/features/harvest/pages/.gitkeep
touch src/features/harvest/services/.gitkeep

# sales
touch src/features/sales/components/.gitkeep
touch src/features/sales/hooks/.gitkeep
touch src/features/sales/pages/.gitkeep
touch src/features/sales/services/.gitkeep

# agronomy
touch src/features/agronomy/components/.gitkeep
touch src/features/agronomy/hooks/.gitkeep
touch src/features/agronomy/pages/.gitkeep
touch src/features/agronomy/services/.gitkeep

# notifications
touch src/features/notifications/components/.gitkeep
touch src/features/notifications/hooks/.gitkeep
touch src/features/notifications/pages/.gitkeep
touch src/features/notifications/services/.gitkeep

# ussd
touch src/features/ussd/components/.gitkeep
touch src/features/ussd/hooks/.gitkeep
touch src/features/ussd/pages/.gitkeep
touch src/features/ussd/services/.gitkeep

# ----------------------------------------------------------------------
# 6. Global hooks
# ----------------------------------------------------------------------
touch src/hooks/useAuth.ts
touch src/hooks/useRole.ts
touch src/hooks/useLocalStorage.ts

# ----------------------------------------------------------------------
# 7. lib utilities
# ----------------------------------------------------------------------
touch src/lib/formatters.ts
touch src/lib/validators.ts
touch src/lib/errorHandler.ts

# ----------------------------------------------------------------------
# 8. Top-level page components
# ----------------------------------------------------------------------
touch src/pages/AuthPage.tsx
touch src/pages/DashboardPage.tsx
touch src/pages/NotFoundPage.tsx

# ----------------------------------------------------------------------
# 9. Global stores (Zustand)
# ----------------------------------------------------------------------
touch src/store/authStore.ts
touch src/store/appStore.ts

# ----------------------------------------------------------------------
# 10. Styles
# ----------------------------------------------------------------------
touch src/styles/index.css

# ----------------------------------------------------------------------
# 11. Type definitions
# ----------------------------------------------------------------------
touch src/types/user.ts
touch src/types/cooperative.ts
touch src/types/harvest.ts
touch src/types/sales.ts
touch src/types/agronomy.ts
touch src/types/notification.ts
touch src/types/api.ts

# ----------------------------------------------------------------------
# 12. Utils folder (placeholder)
# ----------------------------------------------------------------------
touch src/utils/.gitkeep

# ----------------------------------------------------------------------
# 13. Assets folder (placeholder)
# ----------------------------------------------------------------------
touch src/assets/.gitkeep

echo "✅ Frontend structure created successfully at ./src/"
