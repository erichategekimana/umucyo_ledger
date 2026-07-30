export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COOPERATIVES: '/cooperatives',
  HARVEST: '/harvest',
  SALES: '/sales',
  AGRONOMY: '/agronomy',
  NOTIFICATIONS: '/notifications',
  USSD: '/ussd',
  PROFILE: '/profile',
  NOT_FOUND: '/404',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];