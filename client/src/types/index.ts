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
