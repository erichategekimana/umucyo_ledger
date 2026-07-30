export const ENDPOINTS = {
  AUTH: {
    TOKEN: '/auth/token/',
    REFRESH: '/auth/refresh/',
    REGISTER: '/auth/register/',
  },
  USER: {
    ME: '/users/me/',
    LIST: '/users/',
    DETAIL: (id: string) => `/users/${id}/`,
    CHANGE_ROLE: (id: string) => `/users/${id}/change_role/`,
  },
  COOPERATIVES: {
    LIST: '/cooperatives/',
    DETAIL: (id: string) => `/cooperatives/${id}/`,
    APPROVED: '/cooperatives/approved_list/',
    APPROVE: (id: string) => `/cooperatives/${id}/approve/`,
    DECLINE: (id: string) => `/cooperatives/${id}/decline/`,
  },
  FARMERS: {
    LIST: '/farmers/',
    DETAIL: (id: string) => `/farmers/${id}/`,
    APPROVE: (id: string) => `/farmers/${id}/approve/`,
    DECLINE: (id: string) => `/farmers/${id}/decline/`,
  },
  VET_APPLICATIONS: {
    LIST: '/veterinarian-applications/',
    DETAIL: (id: string) => `/veterinarian-applications/${id}/`,
    APPROVE: (id: string) => `/veterinarian-applications/${id}/approve/`,
    DECLINE: (id: string) => `/veterinarian-applications/${id}/decline/`,
  },
};