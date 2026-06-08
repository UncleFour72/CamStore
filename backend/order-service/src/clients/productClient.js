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

const findProductVariant = (product, options = {}) => {
  const variants = Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant.is_active !== false)
    : [];
  const variantId = options.variantId ? Number(options.variantId) : null;
  const variantKey = options.variantKey ? String(options.variantKey).trim() : '';

  if (variantId) {
    const variant = variants.find((item) => Number(item.id) === variantId);

    if (!variant) {
      const error = new Error('Product variant is not available');
      error.statusCode = 400;
      throw error;
    }

    return variant;
  }

  if (variantKey) {
    const variant = variants.find((item) => item.variant_key === variantKey);

    if (!variant) {
      const error = new Error('Product variant is not available');
      error.statusCode = 400;
      throw error;
    }

    return variant;
  }

  return variants.find((item) => item.is_default) || variants[0] || null;
};

export const getProductSnapshot = async (productId, options = {}) => {
  const data = await requestJson(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
  const product = data.product;

  if (!product || product.is_active === false) {
    const error = new Error('Product is not available');
    error.statusCode = 400;
    throw error;
  }

  const variant = findProductVariant(product, options);
  const primaryImage = getPrimaryImage(product);

  return {
    id: product.id,
    name: product.name,
    price: Number(variant?.price ?? product.price),
    image: variant?.image_url || primaryImage,
    stock_quantity: Number(variant?.stock_quantity ?? product.stock_quantity),
    variant_id: variant?.id || null,
    variant_key: variant?.variant_key || 'body',
    variant_name: variant?.name || product.name,
  };
};

const buildStockBody = (operation, quantity, options = {}) => {
  const body = { operation, quantity };
  const variantId = options.variant_id ?? options.variantId;
  const variantKey = options.variant_key ?? options.variantKey;

  if (variantId) {
    body.variant_id = variantId;
  }

  if (variantKey) {
    body.variant_key = variantKey;
  }

  return body;
};

export const decrementStock = async (productId, quantity, options = {}) => {
  return requestJson(`${PRODUCT_SERVICE_URL}/api/products/${productId}/stock`, {
    method: 'PATCH',
    headers: internalHeaders(),
    body: JSON.stringify(buildStockBody('decrement', quantity, options)),
  });
};

export const incrementStock = async (productId, quantity, options = {}) => {
  return requestJson(`${PRODUCT_SERVICE_URL}/api/products/${productId}/stock`, {
    method: 'PATCH',
    headers: internalHeaders(),
    body: JSON.stringify(buildStockBody('increment', quantity, options)),
  });
};
