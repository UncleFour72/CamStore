import api, { unwrapData } from './api.js';

export const getAddresses = () => {
  return api.get('/addresses').then(unwrapData);
};

export const createAddress = (payload) => {
  return api.post('/addresses', payload).then(unwrapData);
};

export const updateAddress = (id, payload) => {
  return api.put(`/addresses/${id}`, payload).then(unwrapData);
};

export const deleteAddress = (id) => {
  return api.delete(`/addresses/${id}`).then(unwrapData);
};

export const setDefaultAddress = (id) => {
  return api.put(`/addresses/${id}/default`).then(unwrapData);
};
