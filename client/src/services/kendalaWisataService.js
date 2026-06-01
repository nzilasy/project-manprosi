import api from './api';

export const kendalaWisataService = {
  getAll: (params = {}) => api.get('/kendala-wisata', { params }),
  create: (payload) => api.post('/kendala-wisata', payload),
  update: (id, payload) => api.put(`/kendala-wisata/${id}`, payload),
  updateStatus: (id, status) => api.patch(`/kendala-wisata/${id}/status`, { status }),
  remove: (id) => api.delete(`/kendala-wisata/${id}`),
};
