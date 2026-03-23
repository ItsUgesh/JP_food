export type Role = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Drinks' | 'Snacks' | 'Meals';
  createdAt: any;
  updatedAt?: any;
}

export interface OrderItem {
  id: string;
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
  paidAt?: any;
}
