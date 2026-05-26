import api from './api';

export const kunjunganWisataService = {
  getAll: (params = {}) => api.get('/kunjungan-wisata', { params }),
  getSummary: (params = {}) => api.get('/kunjungan-wisata/summary', { params }),
  getById: (id) => api.get(`/kunjungan-wisata/${id}`),
  create: (payload) => api.post('/kunjungan-wisata', payload),
  update: (id, payload) => api.put(`/kunjungan-wisata/${id}`, payload),
  remove: (id) => api.delete(`/kunjungan-wisata/${id}`),
};
