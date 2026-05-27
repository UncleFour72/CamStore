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

export const updateProductRating = async ({ productId, averageRating, totalReviews }) => {
  return requestJson(`${PRODUCT_SERVICE_URL}/api/products/${productId}/rating`, {
    method: 'PATCH',
    headers: internalHeaders(),
    body: JSON.stringify({
      average_rating: averageRating,
      total_reviews: totalReviews,
    }),
  });
};
