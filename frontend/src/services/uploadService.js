import api, { unwrapData } from './api.js';

export const uploadImage = (file, folder = 'camstore') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  return api.post('/uploads/image', formData).then(unwrapData);
};
