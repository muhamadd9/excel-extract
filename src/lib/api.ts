import axios from 'axios';

const BASE_URL = 'http://72.61.188.199:3401';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('artscape_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  signup: (data: { fullname: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/user/me'),
};

// Arts API
export const artsAPI = {
  getAll: (params?: { page?: number; limit?: number; sort?: string }) =>
    api.get('/art', { params }),
  getById: (id: string) => api.get(`/art/${id}`),
  create: (formData: FormData) =>
    api.post('/art', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, formData: FormData) =>
    api.patch(`/art/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/art/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (data: {
    artId: string;
    phoneNumber: string;
    phoneNumberSecondary?: string;
    address: { city: string; street: string; zipCode?: string };
    paymentMethod?: string;
  }) => api.post('/order', data),
  getMine: (params?: { page?: number; limit?: number }) =>
    api.get('/order/mine', { params }),
  getMyOrders: (params?: { page?: number; limit?: number }) =>
    api.get('/order/my-orders', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/order/${id}/status`, { status }),
};

// Blogs API
export const blogsAPI = {
  getAll: (params?: { page?: number; limit?: number; sort?: string; following?: string }) =>
    api.get('/blog', { params }),
  getById: (id: string) => api.get(`/blog/${id}`),
  create: (formData: FormData) =>
    api.post('/blog', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, formData: FormData) =>
    api.patch(`/blog/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/blog/${id}`),
  like: (id: string) => api.post(`/blog/${id}/like`),
  unlike: (id: string) => api.post(`/blog/${id}/unlike`),
  comment: (id: string, text: string) =>
    api.post(`/blog/${id}/comment`, { text }),
  deleteComment: (id: string, commentId: string) =>
    api.delete(`/blog/${id}/comment`, { data: { commentId } }),
};

// Users API
export const usersAPI = {
  getById: (id: string) => api.get(`/user/${id}`),
  follow: (id: string) => api.post(`/user/${id}/follow`),
  unfollow: (id: string) => api.post(`/user/${id}/unfollow`),
  getMe: () => api.get('/user/me'),
  updateProfile: (data: { username?: string; bio?: string }) => api.patch('/user/me/profile', data),
  updateProfileImage: (formData: FormData) =>
    api.patch('/user/me/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateCoverImage: (formData: FormData) =>
    api.patch('/user/me/cover-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Excel API
export const excelAPI = {
  upload: (formData: FormData) =>
    api.post('/excel/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params?: { page?: number; limit?: number; sort?: string }) =>
    api.get('/excel', { params }),
  getById: (id: string) => api.get(`/excel/${id}`),
  delete: (id: string) => api.delete(`/excel/${id}`),
};
