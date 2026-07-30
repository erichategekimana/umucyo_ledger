export interface Notification {
  id: string;
  farmer: string;
  farmer_name: string;
  farmer_phone: string;
  delivery_id_str: string;
  message: string;
  sent_at: string;
  is_read: boolean;
}