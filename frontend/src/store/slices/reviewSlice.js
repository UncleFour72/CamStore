import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as reviewService from '../../services/reviewService.js';

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

const initialState = {
  reviews: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 5, total: 0, totalPages: 1 },
};

export const fetchProductReviews = createAsyncThunk(
  'review/fetchProductReviews',
  async ({ productId, page = 1, pageSize = 5 }, { rejectWithValue }) => {
    try {
      return await reviewService.getProductReviews(productId, { page, pageSize });
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải đánh giá'));
    }
  }
);

export const createReview = createAsyncThunk(
  'review/createReview',
  async (payload, { rejectWithValue }) => {
    try {
      return await reviewService.createReview(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tạo đánh giá'));
    }
  }
);

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    clearReviewError: (state) => {
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

    builder
      .addCase(fetchProductReviews.pending, markPending)
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchProductReviews.rejected, markRejected('Không thể tải đánh giá'))
      .addCase(createReview.pending, markPending)
      .addCase(createReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = [action.payload, ...state.reviews.filter((review) => review.id !== action.payload.id)];
        state.pagination.total += 1;
      })
      .addCase(createReview.rejected, markRejected('Không thể tạo đánh giá'));
  },
});

export const { clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;
