import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addToCart,
  clearCart as clearReduxCart,
  fetchCart,
  removeFromCart,
  updateCartItem,
} from '../store/slices/cartSlice.js';

export function useCart() {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const itemCount = cart.totalItems || cart.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (isAuthenticated && !cart.hasLoaded && !cart.isLoading) {
      dispatch(fetchCart());
    }
  }, [cart.hasLoaded, cart.isLoading, dispatch, isAuthenticated]);

  return {
    items: cart.items,
    itemCount,
    subtotal: cart.subtotal,
    shipping: 0,
    total: cart.total,
    isLoading: cart.isLoading,
    error: cart.error,
    fetchCart: () => dispatch(fetchCart()),
    addItem: (productId, quantity = 1, variant = null) => dispatch(addToCart({ productId, quantity, variant })),
    updateQuantity: (itemId, quantity) =>
      dispatch(updateCartItem({ itemId, quantity: Math.max(Number(quantity) || 1, 1) })),
    removeItem: (itemId) => dispatch(removeFromCart(itemId)),
    clearCart: () => dispatch(clearReduxCart()),
  };
}
