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
  },
  // other domains will be added later
};