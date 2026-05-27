import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { products } from '../../data/catalog.js';

const WISHLIST_KEY = 'camstore_wishlist';

function readWishlist() {
  try {
    const stored = localStorage.getItem(WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWishlist(productIds) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(productIds));
  return productIds;
}

function hydrateWishlist(productIds) {
  return productIds
    .map((productId) => products.find((product) => product.id === productId))
    .filter(Boolean);
}

const initialIds = readWishlist();

const initialState = {
  productIds: initialIds,
  items: hydrateWishlist(initialIds),
  isLoading: false,
  error: null,
};

export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async () => {
  const productIds = readWishlist();
  return { productIds, items: hydrateWishlist(productIds) };
});

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const product = products.find((item) => item.id === productId);
      if (!product) throw new Error('San pham khong ton tai');

      const productIds = Array.from(new Set([...readWishlist(), productId]));
      saveWishlist(productIds);

      return { productIds, items: hydrateWishlist(productIds) };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const productIds = readWishlist().filter((id) => id !== productId);
      saveWishlist(productIds);

      return { productIds, items: hydrateWishlist(productIds) };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggleWishlist',
  async (productId, { dispatch }) => {
    const exists = readWishlist().includes(productId);
    return dispatch(exists ? removeFromWishlist(productId) : addToWishlist(productId))
      .unwrap();
  }
);

export const clearWishlist = createAsyncThunk('wishlist/clearWishlist', async () => {
  saveWishlist([]);
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
    const applyWishlistPayload = (state, action) => {
      state.isLoading = false;
      state.productIds = action.payload.productIds;
      state.items = action.payload.items;
    };

    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, applyWishlistPayload)
      .addCase(addToWishlist.fulfilled, applyWishlistPayload)
      .addCase(removeFromWishlist.fulfilled, applyWishlistPayload)
      .addCase(toggleWishlist.fulfilled, applyWishlistPayload)
      .addCase(clearWishlist.fulfilled, applyWishlistPayload)
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Khong the tai wishlist';
      });
  },
});

export const { clearWishlistError } = wishlistSlice.actions;
export default wishlistSlice.reducer;
