import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as cartService from '../../services/cartService.js';
import { logoutUser } from './authSlice.js';

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

const emptyCartState = {
  items: [],
  subtotal: 0,
  total: 0,
  totalItems: 0,
};

const initialState = {
  ...emptyCartState,
  isLoading: false,
  error: null,
  hasLoaded: false,
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      return await cartService.getCart();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải giỏ hàng'));
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      return await cartService.addToCart({ productId, quantity });
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể thêm vào giỏ hàng'));
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      return await cartService.updateCartItem(itemId, quantity);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể cập nhật giỏ hàng'));
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      return await cartService.removeCartItem(itemId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể xóa sản phẩm khỏi giỏ'));
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      return await cartService.clearCart();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể xóa giỏ hàng'));
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const markPending = (state) => {
      state.isLoading = true;
      state.error = null;
    };
    const markRejected = (fallback) => (state, action) => {
      state.isLoading = false;
      state.error = action.payload || fallback;
    };
    const applyCartPayload = (state, action) => {
      state.isLoading = false;
      state.error = null;
      state.hasLoaded = true;
      state.items = action.payload.items;
      state.subtotal = action.payload.subtotal;
      state.total = action.payload.total;
      state.totalItems = action.payload.totalItems;
    };

    builder
      .addCase(fetchCart.pending, markPending)
      .addCase(fetchCart.fulfilled, applyCartPayload)
      .addCase(fetchCart.rejected, markRejected('Không thể tải giỏ hàng'))
      .addCase(addToCart.pending, markPending)
      .addCase(addToCart.fulfilled, applyCartPayload)
      .addCase(addToCart.rejected, markRejected('Không thể thêm vào giỏ hàng'))
      .addCase(updateCartItem.pending, markPending)
      .addCase(updateCartItem.fulfilled, applyCartPayload)
      .addCase(updateCartItem.rejected, markRejected('Không thể cập nhật giỏ hàng'))
      .addCase(removeFromCart.pending, markPending)
      .addCase(removeFromCart.fulfilled, applyCartPayload)
      .addCase(removeFromCart.rejected, markRejected('Không thể xóa sản phẩm khỏi giỏ'))
      .addCase(clearCart.pending, markPending)
      .addCase(clearCart.fulfilled, applyCartPayload)
      .addCase(clearCart.rejected, markRejected('Không thể xóa giỏ hàng'))
      .addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetCartError } = cartSlice.actions;
export default cartSlice.reducer;
