import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { requestJson } from './http.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

const internalHeaders = () => ({
  'x-internal-api-key': process.env.INTERNAL_API_KEY || '',
});

const getPrimaryImage = (product) => {
  const images = Array.isArray(product.images) ? product.images : [];
  const primary = images.find((image) => image.is_primary) || images[0];

  return primary?.image_url || null;
};

export const getProductSnapshot = async (productId) => {
  const data = await requestJson(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
  const product = data.product;

  if (!product || product.is_active === false) {
    const error = new Error('Product is not available');
    error.statusCode = 400;
    throw error;
  }

  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    image: getPrimaryImage(product),
    stock_quantity: Number(product.stock_quantity),
  };
};

export const decrementStock = async (productId, quantity) => {
  return requestJson(`${PRODUCT_SERVICE_URL}/api/products/${productId}/stock`, {
    method: 'PATCH',
    headers: internalHeaders(),
    body: JSON.stringify({
      operation: 'decrement',
      quantity,
    }),
  });
};

export const incrementStock = async (productId, quantity) => {
  return requestJson(`${PRODUCT_SERVICE_URL}/api/products/${productId}/stock`, {
    method: 'PATCH',
    headers: internalHeaders(),
    body: JSON.stringify({
      operation: 'increment',
      quantity,
    }),
  });
};
