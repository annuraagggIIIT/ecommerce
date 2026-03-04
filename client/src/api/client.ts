import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signup: (data: { name: string; email: string; password: string; role?: string }) =>
    apiClient.post('/signup', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/login', data),
  me: () => apiClient.get('/me'),
};

// Products API
export const productsApi = {
  getAll: () => apiClient.get('/products'),
  getById: (id: number) => apiClient.get(`/products/${id}`),
  create: (data: { name: string; description: string; price: number; tags: string[] }) =>
    apiClient.post('/products', data),
  update: (id: number, data: Partial<{ name: string; description: string; price: number; tags: string[] }>) =>
    apiClient.put(`/products/${id}`, data),
  delete: (id: number) => apiClient.delete(`/products/${id}`),
};

// Users API
export const usersApi = {
  // Address management
  addAddress: (data: { lineOne: string; lineTwo?: string; city: string; country: string; pinCode: string }) =>
    apiClient.post('/users/address', data),
  listAddresses: () => apiClient.get('/users/address'),
  deleteAddress: (id: number) => apiClient.delete(`/users/address/${id}`),
  // User profile
  updateUser: (data: { name?: string; defaultShippingAddressId?: number; defaultBillingAddressId?: number }) =>
    apiClient.put('/users/', data),
};

// Cart API
export const cartApi = {
  getCart: () => apiClient.get('/cart'),
  addItem: (data: { productId: number; quantity: number }) => apiClient.post('/cart', data),
  updateQuantity: (id: number, quantity: number) => apiClient.put(`/cart/${id}`, { quantity }),
  removeItem: (id: number) => apiClient.delete(`/cart/${id}`),
};

// Orders API
export const ordersApi = {
  create: (addressId?: number) => apiClient.post('/orders', { addressId }),
  getAll: () => apiClient.get('/orders'),
  getById: (id: number) => apiClient.get(`/orders/${id}`),
  cancel: (id: number) => apiClient.put(`/orders/${id}/cancel`),
};

// Admin Orders API
export const adminOrdersApi = {
  getAll: (status?: string) => apiClient.get('/orders/admin/all', { params: { status } }),
  updateStatus: (id: number, status: string) => apiClient.put(`/orders/admin/${id}/status`, { status }),
};

// Payments API
export const paymentsApi = {
  createOrder: () => apiClient.post('/payments/create-order'),
  verify: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    addressId?: number;
  }) => apiClient.post('/payments/verify', data),
};
