import api from './api';

export const panenService = {
  getAll: (params = {}) => api.get('/panen', { params }),
  getById: (id) => api.get(`/panen/${id}`),
  create: (payload) => api.post('/panen', payload),
  update: (id, payload) => api.put(`/panen/${id}`, payload),
  remove: (id) => api.delete(`/panen/${id}`),
};
