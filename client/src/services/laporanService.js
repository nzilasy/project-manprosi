import api from './api';

export const laporanService = {
  getAll: (params = {}) => api.get('/laporan', { params }),
  getSummary: (idLahan) => api.get(`/laporan/summary/${idLahan}`),
  create: (payload) => api.post('/laporan', payload),
};
