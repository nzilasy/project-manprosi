import api from './api';

export const aiService = {
  chat: (payload) => api.post('/ai/chat', payload, { timeout: 35000 }),
};
