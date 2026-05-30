import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { requestJson } from './http.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';

const internalHeaders = () => ({
  'x-internal-api-key': process.env.INTERNAL_API_KEY || '',
});

export const createPayment = async (payload) => {
  return requestJson(`${PAYMENT_SERVICE_URL}/api/payments`, {
    method: 'POST',
    headers: internalHeaders(),
    body: JSON.stringify(payload),
  });
};

export const retryPayment = async (orderId, payload) => {
  return requestJson(`${PAYMENT_SERVICE_URL}/api/payments/order/${orderId}/retry`, {
    method: 'PATCH',
    headers: internalHeaders(),
    body: JSON.stringify(payload),
  });
};

export const getPaymentByOrderId = async (orderId) => {
  try {
    return await requestJson(`${PAYMENT_SERVICE_URL}/api/payments/order/${orderId}`, {
      headers: internalHeaders(),
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }
};
