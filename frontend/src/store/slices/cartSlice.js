import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { products } from '../../data/catalog.js';

const CART_KEY = 'camstore_redux_cart';

function readCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Fall through to default cart.
  }

  return [];
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  return items;
}

function hydrateItems(items) {
  return items
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return null;

      return {
        ...item,
        id: item.id || item.productId,
        product,
        price: product.price,
        quantity: Math.max(Number(item.quantity) || 1, 1),
      };
    })
    .filter(Boolean);
}

function calculateTotals(items) {
  const hydratedItems = hydrateItems(items);
  const subtotal = hydratedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    items: hydratedItems,
    subtotal,
    total: subtotal,
  };
}

const initialState = {
  ...calculateTotals(readCart()),
  isLoading: false,
  error: null,
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async () => {
  return calculateTotals(readCart());
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const product = products.find((item) => item.id === productId);
      if (!product) throw new Error('San pham khong ton tai');

      const items = readCart();
      const existing = items.find((item) => item.productId === productId);

      const nextItems = existing
        ? items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...items, { id: productId, productId, quantity }];

      return calculateTotals(saveCart(nextItems));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const items = readCart().map((item) =>
        item.id === itemId || item.productId === itemId
          ? { ...item, quantity: Math.max(Number(quantity) || 1, 1) }
          : item
      );

      return calculateTotals(saveCart(items));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const items = readCart().filter(
        (item) => item.id !== itemId && item.productId !== itemId
      );

      return calculateTotals(saveCart(items));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const clearCart = createAsyncThunk('cart/clearCart', async () => {
  return calculateTotals(saveCart([]));
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const applyCartPayload = (state, action) => {
      state.isLoading = false;
      state.items = action.payload.items;
      state.subtotal = action.payload.subtotal;
      state.total = action.payload.total;
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, applyCartPayload)
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Khong the tai gio hang';
      })
      .addCase(addToCart.fulfilled, applyCartPayload)
      .addCase(updateCartItem.fulfilled, applyCartPayload)
      .addCase(removeFromCart.fulfilled, applyCartPayload)
      .addCase(clearCart.fulfilled, applyCartPayload);
  },
});

export const { resetCartError } = cartSlice.actions;
export default cartSlice.reducer;
