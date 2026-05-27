import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { requestJson } from './http.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3004';

const internalHeaders = () => ({
  'x-internal-api-key': process.env.INTERNAL_API_KEY || '',
});

export const updateOrderStatus = async (orderId, status, note) => {
  return requestJson(`${ORDER_SERVICE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: internalHeaders(),
    body: JSON.stringify({
      status,
      note,
    }),
  });
};
