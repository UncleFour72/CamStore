import api, { unwrapData } from './api.js';

export const login = (payload) => {
  return api.post('/auth/login', payload).then(unwrapData);
};

export const loginWithGoogle = (credential) => {
  return api.post('/auth/google', { credential }).then(unwrapData);
};

export const loginWithFacebook = (accessToken) => {
  return api.post('/auth/facebook', { access_token: accessToken }).then(unwrapData);
};

export const register = (payload) => {
  return api.post('/auth/register', payload).then(unwrapData);
};

export const requestPasswordReset = (payload) => {
  return api.post('/auth/forgot-password', payload).then(unwrapData);
};

export const resetPassword = (payload) => {
  return api.post('/auth/reset-password', payload).then(unwrapData);
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
