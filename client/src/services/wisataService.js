import api from './api';

export const wisataService = {
  getPoints: (params = {}) => api.get('/wisata/points', { params }),
  getAll: (params = {}) => api.get('/wisata', { params }),
  create: (payload) => api.post('/wisata', payload),
  update: (id, payload) => api.put(`/wisata/${id}`, payload),
  delete: (id) => api.delete(`/wisata/${id}`),
};
