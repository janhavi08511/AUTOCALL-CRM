import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard/kpi'),
  getUsers: (role) => api.get('/admin/users', { params: { role } }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getLoanCategories: () => api.get('/admin/loan-categories'),
  createLoanCategory: (data) => api.post('/admin/loan-categories', data),
  getLeads: (params) => api.get('/admin/leads', { params }),
  getCallLogs: (params) => api.get('/admin/call-logs', { params })
};

export const managerAPI = {
  getDashboard: () => api.get('/manager/dashboard/stats'),
  getCharts: () => api.get('/manager/dashboard/charts'),
  getLoanCategories: () => api.get('/manager/loan-categories'),
  getUnassignedLeads: (params) => api.get('/manager/leads/unassigned', { params }),
  getStaff: () => api.get('/manager/staff'),
  assignLeads: (data) => api.post('/manager/leads/assign', data),
  getStaffMonitoring: () => api.get('/manager/staff/monitoring'),
  getReports: (params) => api.get('/manager/reports', { params }),
  getQualificationDashboard: (params) => api.get('/manager/qualification-dashboard', { params })
};

export const staffAPI = {
  getDashboard: () => api.get('/staff/dashboard/stats'),
  getLeads: (params) => api.get('/staff/leads', { params }),
  getLeadPhone: (id) => api.get(`/staff/leads/${id}/phone`),
  updateCallStatus: (data) => api.post('/staff/call-status', data),
  savePendingDetails: (data) => api.post('/staff/pending-details', data),
  getCallHistory: (params) => api.get('/staff/call-history', { params })
};

export const uploadAPI = {
  uploadExcel: (formData) => api.post('/upload/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getLoanCategories: () => api.get('/upload/loan-categories'),
  getHistory: (params) => api.get('/upload/history', { params }),
  downloadTemplate: () => api.get('/upload/template', { responseType: 'blob' })
};

export default api;
