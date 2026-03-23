export type Role = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: Role;
  lastLoginAt?: any;
  createdAt?: any;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  createdAt: any;
  updatedAt?: any;
}

export interface OrderItem {
  id: string; // Original MenuItem ID
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid';
  paymentMethod?: 'cash' | 'esewa';
  createdAt: any;
  updatedAt?: any;
  paidAt?: any;
}
