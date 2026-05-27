import { useDispatch, useSelector } from 'react-redux';
import {
  addToCart,
  clearCart as clearReduxCart,
  removeFromCart,
  updateCartItem,
} from '../store/slices/cartSlice.js';

export function useCart() {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: cart.items,
    itemCount,
    subtotal: cart.subtotal,
    shipping: 0,
    total: cart.total,
    isLoading: cart.isLoading,
    error: cart.error,
    addItem: (productId, quantity = 1) => dispatch(addToCart({ productId, quantity })),
    updateQuantity: (productId, quantity) => dispatch(updateCartItem({ itemId: productId, quantity })),
    removeItem: (productId) => dispatch(removeFromCart(productId)),
    clearCart: () => dispatch(clearReduxCart()),
  };
}
