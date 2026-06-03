import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as wishlistService from '../../services/wishlistService.js';
import { logoutUser } from './authSlice.js';

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

const normalizeId = (value) => Number(value);

const initialState = {
  productIds: [],
  items: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      return await wishlistService.getWishlist();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải wishlist'));
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      return await wishlistService.addToWishlist(productId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể thêm vào wishlist'));
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      return await wishlistService.removeFromWishlist(productId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể xóa khỏi wishlist'));
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggleWishlist',
  async (productId, { dispatch, getState }) => {
    const exists = getState().wishlist.productIds.some((id) => normalizeId(id) === normalizeId(productId));
    return dispatch(exists ? removeFromWishlist(productId) : addToWishlist(productId)).unwrap();
  }
);

export const clearWishlist = createAsyncThunk('wishlist/clearWishlist', async () => {
  return { productIds: [], items: [] };
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlistError: (state) => {
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
    const setWishlist = (state, action) => {
      state.isLoading = false;
      state.error = null;
      state.hasLoaded = true;
      state.productIds = action.payload.productIds;
      state.items = action.payload.items;
    };
    const upsertProduct = (state, action) => {
      state.isLoading = false;
      state.error = null;
      state.hasLoaded = true;
      const productId = action.payload.productId;
      const product = action.payload.product;

      if (!state.productIds.some((id) => normalizeId(id) === normalizeId(productId))) {
        state.productIds.unshift(productId);
      }

      if (product && !state.items.some((item) => normalizeId(item.productId) === normalizeId(productId))) {
        state.items.unshift(product);
      }
    };
    const removeProduct = (state, action) => {
      const productId = action.payload;
      state.isLoading = false;
      state.error = null;
      state.productIds = state.productIds.filter((id) => normalizeId(id) !== normalizeId(productId));
      state.items = state.items.filter((item) => normalizeId(item.productId) !== normalizeId(productId));
    };

    builder
      .addCase(fetchWishlist.pending, markPending)
      .addCase(fetchWishlist.fulfilled, setWishlist)
      .addCase(fetchWishlist.rejected, markRejected('Không thể tải wishlist'))
      .addCase(addToWishlist.pending, markPending)
      .addCase(addToWishlist.fulfilled, upsertProduct)
      .addCase(addToWishlist.rejected, markRejected('Không thể thêm vào wishlist'))
      .addCase(removeFromWishlist.pending, markPending)
      .addCase(removeFromWishlist.fulfilled, removeProduct)
      .addCase(removeFromWishlist.rejected, markRejected('Không thể xóa khỏi wishlist'))
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        if (action.payload?.product) {
          upsertProduct(state, action);
        } else {
          removeProduct(state, action);
        }
      })
      .addCase(clearWishlist.fulfilled, setWishlist)
      .addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { clearWishlistError } = wishlistSlice.actions;
export default wishlistSlice.reducer;
