export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COOPERATIVES: '/cooperatives',
  COOPERATIVE_NEW: '/cooperatives/new',
  COOPERATIVE_EDIT: (id: string) => `/cooperatives/${id}/edit`,
  STAFF: '/staff',
  STAFF_NEW: '/staff/new',
  STAFF_EDIT: (id: string) => `/staff/${id}/edit`,
  FARMERS: '/farmers',
  FARMER_NEW: '/farmers/new',
  FARMER_EDIT: (id: string) => `/farmers/${id}/edit`,


  HARVEST: '/harvest',
  BATCHES: '/harvest/batches',
  DELIVERIES: '/harvest/deliveries',
  DELIVERY_NEW: '/harvest/deliveries/new',
  ADJUSTMENTS: '/harvest/adjustments',
  DISCREPANCIES: '/harvest/discrepancies',
  CROP_PRICES: '/crop-prices',

  SALES: '/sales',
  SALES_NEW: '/sales/new',
  PAYOUTS: '/payouts',
  AUDIT_REPORT: '/audit-report',


  AGRONOMY: '/agronomy',
  ANOMALIES: '/agronomy/anomalies',
  ANOMALY_NEW: '/agronomy/anomalies/new',
  ANOMALY_EDIT: (id: string) => `/agronomy/anomalies/${id}/edit`,
  ANOMALY_MAP: '/agronomy/map',

  NOTIFICATIONS: '/notifications',


  USSD: '/ussd',
  USSD_LOGS: '/ussd/logs',
  
  PROFILE: '/profile',
  APPROVALS: '/approvals',
  ROLE_MANAGEMENT: '/role-management',
  NOT_FOUND: '/404',
} as const;