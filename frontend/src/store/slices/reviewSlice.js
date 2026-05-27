import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const REVIEW_KEY = 'camstore_reviews';

const demoReviews = [
  {
    id: 'review-1',
    productId: 'sony-alpha-a7-iv',
    userName: 'Minh Quan',
    rating: 5,
    comment: 'May lay net nhanh, mau rat dep va cam chac tay.',
    createdAt: '2026-05-12',
  },
  {
    id: 'review-2',
    productId: 'sony-fe-24-70-f28-gm',
    userName: 'Hoang Linh',
    rating: 5,
    comment: 'Bokeh dep, chup chan dung rat da.',
    createdAt: '2026-05-09',
  },
];

function readReviews() {
  try {
    const stored = localStorage.getItem(REVIEW_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Fall through to demo reviews.
  }

  return demoReviews;
}

function saveReviews(reviews) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
  return reviews;
}

function paginate(items, params = {}) {
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 5;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

const initialState = {
  reviews: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 5, total: 0, totalPages: 0 },
};

export const fetchProductReviews = createAsyncThunk(
  'review/fetchProductReviews',
  async ({ productId, page = 1, pageSize = 5 }, { rejectWithValue }) => {
    try {
      const reviews = readReviews().filter((review) => review.productId === productId);
      return paginate(reviews, { page, pageSize });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createReview = createAsyncThunk(
  'review/createReview',
  async ({ productId, rating, comment, userName = 'CamStore User' }, { rejectWithValue }) => {
    try {
      const review = {
        id: `review-${Date.now()}`,
        productId,
        rating,
        comment,
        userName,
        createdAt: new Date().toISOString(),
      };

      saveReviews([review, ...readReviews()]);
      return review;
    } catch (error) {
      return rejectWithValue(error.message);
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
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
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
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Khong the tai danh gia';
      })
      .addCase(createReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews.unshift(action.payload);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Khong the tao danh gia';
      });
  },
});

export const { clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;
