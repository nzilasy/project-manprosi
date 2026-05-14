import api from './api';

export const komoditasService = {
  getAll: (params = {}) => api.get('/komoditas', { params }),
  getById: (id) => api.get(`/komoditas/${id}`),
  create: (payload) => api.post('/komoditas', payload),
  update: (id, payload) => api.put(`/komoditas/${id}`, payload),
  remove: (id) => api.delete(`/komoditas/${id}`),
};