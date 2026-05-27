import api, { unwrapData } from './api.js';

export const login = (payload) => {
  return api.post('/auth/login', payload).then(unwrapData);
};

export const register = (payload) => {
  return api.post('/auth/register', payload).then(unwrapData);
};

export const getProfile = () => {
  return api.get('/auth/profile').then(unwrapData);
};

export const updateProfile = (payload) => {
  return api.put('/auth/profile', payload).then(unwrapData);
};

export const changePassword = (payload) => {
  return api.put('/auth/change-password', payload).then(unwrapData);
};
