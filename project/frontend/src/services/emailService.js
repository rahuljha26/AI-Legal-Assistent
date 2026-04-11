import API from '../api';

export const emailService = {
  sendEmail: (payload) => API.post('/email/send/', payload),
  getEmailHistory: (page = 1) => API.get(`/email/history/?page=${page}`),
};
