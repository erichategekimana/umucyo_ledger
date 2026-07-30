export type Role =
  | 'FARMER'
  | 'COLLECTION_OFFICER'
  | 'MANAGER'
  | 'ADMIN'
  | 'VETERINARIAN'
  | 'SUPER_ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  role: Role;
  role_display: string;
  preferred_language: 'rw' | 'en';
  is_active: boolean;
  created_at: string;
}