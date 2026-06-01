import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as productService from '../../services/productService.js';

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

const initialState = {
  products: [],
  currentProduct: null,
  categories: [],
  brands: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 12, total: 0, totalPages: 1 },
  filters: {},
};

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await productService.getProducts(params);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải sản phẩm'));
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'product/fetchProduct',
  async (idOrSlug, { rejectWithValue }) => {
    try {
      const product = await productService.getProduct(idOrSlug);

      if (!product) {
        throw new Error('Không tìm thấy sản phẩm');
      }

      return product;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải sản phẩm'));
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'product/fetchCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await productService.getCategories(params);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải danh mục'));
    }
  }
);

export const fetchBrands = createAsyncThunk(
  'product/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getBrands();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải thương hiệu'));
    }
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Không thể tải sản phẩm';
      })
      .addCase(fetchProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Không thể tải sản phẩm';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.error = action.payload || 'Không thể tải danh mục';
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.error = action.payload || 'Không thể tải thương hiệu';
      });
  },
});

export const { setFilters, clearFilters, setPage, clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;
