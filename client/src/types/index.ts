export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  defaultShippingAddressId?: number;
  defaultBillingAddressId?: number;
  createdAt: string;
  updatedAt: string;
  addresses?: Address[];
}

export interface Address {
  id: number;
  lineOne: string;
  lineTwo?: string;
  city: string;
  country: string;
  pinCode: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  tags: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  errorCode: string;
  errors?: Record<string, unknown>;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface OrderProduct {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  address: string;
  product: Product;
  createdAt: string;
  updatedAt: string;
}

export interface OrderEvent {
  id: number;
  orderId: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  netAmount: number;
  address: string;
  products: OrderProduct[];
  events: OrderEvent[];
  createdAt: string;
  updatedAt: string;
}
