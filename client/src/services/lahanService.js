import api from './api';

export const lahanService = {
  getPublic: () => api.get('/lahan/public'),
  getAll: (params = {}) => api.get('/lahan', { params }),
  getInactive: () => api.get('/lahan/inactive'),
  getSummary: () => api.get('/lahan/summary'),
  getById: (id) => api.get(`/lahan/${id}`),
  create: (payload) => api.post('/lahan', payload),
  update: (id, payload) => api.put(`/lahan/${id}`, payload),
  remove: (id) => api.delete(`/lahan/${id}`),
};
