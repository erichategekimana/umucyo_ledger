export interface USSDLog {
  id: string;
  session_id: string;
  phone_number: string;
  text: string;
  response: string;
  menu_level: number;
  is_final: boolean;
  created_at: string;
}