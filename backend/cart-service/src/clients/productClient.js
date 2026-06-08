import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const REQUEST_TIMEOUT_MS = Number(process.env.INTERNAL_REQUEST_TIMEOUT_MS || 8000);

const withTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
};

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

export const fetchProductSnapshot = async (productId, options = {}) => {
  const response = await withTimeout(`${PRODUCT_SERVICE_URL}/api/products/${productId}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (response.status === 404) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  if (!response.ok) {
    const error = new Error('Product Service is not available');
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
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
