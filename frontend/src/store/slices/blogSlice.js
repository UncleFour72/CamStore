import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as blogService from '../../services/blogService.js';

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

const initialState = {
  posts: [],
  featuredPost: null,
  currentPost: null,
  isLoading: false,
  isSubscribing: false,
  error: null,
  newsletterMessage: '',
  pagination: { page: 1, pageSize: 9, total: 0, totalPages: 1 },
};

export const fetchBlogs = createAsyncThunk(
  'blog/fetchBlogs',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await blogService.getBlogs(params);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải bài viết'));
    }
  }
);

export const fetchFeaturedBlog = createAsyncThunk(
  'blog/fetchFeaturedBlog',
  async (_, { rejectWithValue }) => {
    try {
      return await blogService.getFeaturedBlog();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải bài nổi bật'));
    }
  }
);

export const fetchBlog = createAsyncThunk(
  'blog/fetchBlog',
  async (slug, { rejectWithValue }) => {
    try {
      return await blogService.getBlog(slug);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải bài viết'));
    }
  }
);

export const subscribeNewsletter = createAsyncThunk(
  'blog/subscribeNewsletter',
  async (email, { rejectWithValue }) => {
    try {
      await blogService.subscribeNewsletter(email);
      return 'Đăng ký nhận tin thành công.';
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể đăng ký nhận tin'));
    }
  }
);

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    clearBlogError: (state) => {
      state.error = null;
    },
    clearNewsletterMessage: (state) => {
      state.newsletterMessage = '';
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
      .addCase(fetchBlogs.pending, markPending)
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchBlogs.rejected, markRejected('Không thể tải bài viết'))
      .addCase(fetchFeaturedBlog.fulfilled, (state, action) => {
        state.featuredPost = action.payload;
      })
      .addCase(fetchBlog.pending, markPending)
      .addCase(fetchBlog.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchBlog.rejected, markRejected('Không thể tải bài viết'))
      .addCase(subscribeNewsletter.pending, (state) => {
        state.isSubscribing = true;
        state.error = null;
        state.newsletterMessage = '';
      })
      .addCase(subscribeNewsletter.fulfilled, (state, action) => {
        state.isSubscribing = false;
        state.newsletterMessage = action.payload;
      })
      .addCase(subscribeNewsletter.rejected, (state, action) => {
        state.isSubscribing = false;
        state.error = action.payload || 'Không thể đăng ký nhận tin';
      });
  },
});

export const { clearBlogError, clearNewsletterMessage } = blogSlice.actions;
export default blogSlice.reducer;
