import api, { unwrapData } from './api.js';
import { normalizeProduct } from './productService.js';

const normalizeWishlistProducts = (products = []) => {
  const items = products.map(normalizeProduct).filter(Boolean);

  return {
    items,
    productIds: items.map((product) => product.productId || product.apiId),
  };
};

export const getWishlist = async () => {
  const data = await api.get('/wishlists').then(unwrapData);
  return normalizeWishlistProducts(data.products || []);
};

export const addToWishlist = async (productId) => {
  const data = await api.post('/wishlists', { product_id: productId }).then(unwrapData);
  const product = normalizeProduct(data.product);

  return {
    productId,
    product,
  };
};

export const removeFromWishlist = async (productId) => {
  await api.delete(`/wishlists/${productId}`);
  return productId;
};
