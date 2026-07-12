export type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'returned';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  stock: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface TrackingUpdate {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'success' | 'failed' | 'processing';
  createdAt: string;
  trackingUpdates: TrackingUpdate[];
  username?: string;
}

export interface User {
  username: string;
  name: string;
  role: 'user' | 'admin';
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: 'order' | 'refund' | 'delivery' | 'other';
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
  reply?: string;
  orderId?: string;
}

