import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { requestJson } from './http.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3003';

const internalHeaders = () => ({
  'x-internal-api-key': process.env.INTERNAL_API_KEY || '',
});

export const getCartForUser = async (userId) => {
  const data = await requestJson(`${CART_SERVICE_URL}/api/carts/user/${userId}`, {
    headers: internalHeaders(),
  });

  return data.cart;
};

export const clearCartForUser = async (userId) => {
  await requestJson(`${CART_SERVICE_URL}/api/carts/user/${userId}`, {
    method: 'DELETE',
    headers: internalHeaders(),
  });
};
