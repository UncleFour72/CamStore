import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { requestJson } from './http.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3004';

export const getOrderForUser = async (orderId, token) => {
  const data = await requestJson(`${ORDER_SERVICE_URL}/api/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.order;
};

export const assertOrderContainsDeliveredProduct = async ({ orderId, productId, userId, token }) => {
  const order = await getOrderForUser(orderId, token);

  if (Number(order.user_id) !== Number(userId)) {
    const error = new Error('Order does not belong to current user');
    error.statusCode = 403;
    throw error;
  }

  if (order.status !== 'delivered') {
    const error = new Error('Only delivered orders can be reviewed');
    error.statusCode = 400;
    throw error;
  }

  const hasProduct = Array.isArray(order.items)
    && order.items.some((item) => Number(item.product_id) === Number(productId));

  if (!hasProduct) {
    const error = new Error('Product does not exist in this order');
    error.statusCode = 400;
    throw error;
  }

  return order;
};
