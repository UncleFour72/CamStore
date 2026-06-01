import api, { unwrapData } from './api.js';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85';

const emptyCart = {
  items: [],
  subtotal: 0,
  total: 0,
  totalItems: 0,
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeCart = (cart) => {
  if (!cart) {
    return emptyCart;
  }

  const items = (cart.items || []).map((item) => {
    const price = toNumber(item.product_price);
    const quantity = toNumber(item.quantity, 1);

    return {
      id: item.id,
      productId: item.product_id,
      quantity,
      price,
      subtotal: toNumber(item.subtotal, price * quantity),
      product: {
        id: String(item.product_id),
        productId: item.product_id,
        apiId: item.product_id,
        name: item.product_name,
        price,
        image: item.product_image || FALLBACK_IMAGE,
        eyebrow: 'CamStore',
      },
    };
  });

  return {
    items,
    subtotal: toNumber(cart.subtotal),
    total: toNumber(cart.subtotal),
    totalItems: toNumber(cart.total_items, items.reduce((sum, item) => sum + item.quantity, 0)),
  };
};

export const getCart = async () => {
  const data = await api.get('/cart').then(unwrapData);
  return normalizeCart(data.cart);
};

export const addToCart = async ({ productId, quantity = 1 }) => {
  const data = await api
    .post('/cart', {
      product_id: productId,
      quantity,
    })
    .then(unwrapData);

  return normalizeCart(data.cart);
};

export const updateCartItem = async (itemId, quantity) => {
  const data = await api
    .put(`/cart/items/${itemId}`, {
      quantity: Math.max(Number(quantity) || 1, 1),
    })
    .then(unwrapData);

  return normalizeCart(data.cart);
};

export const removeCartItem = async (itemId) => {
  const data = await api.delete(`/cart/items/${itemId}`).then(unwrapData);
  return normalizeCart(data.cart);
};

export const clearCart = async () => {
  await api.delete('/cart');
  return emptyCart;
};
