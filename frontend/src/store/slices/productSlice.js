import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { categories, products } from '../../data/catalog.js';

function paginate(items, params = {}) {
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 12;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

function applyFilters(items, params = {}) {
  const category = params.category || params.categoryId;
  const search = params.search?.trim().toLowerCase();
  const minPrice = Number(params.minPrice) || 0;
  const maxPrice = Number(params.maxPrice) || Number.POSITIVE_INFINITY;

  return items.filter((product) => {
    const matchesCategory = !category || category === 'all' || product.category === category;
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.tagline.toLowerCase().includes(search);
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;

    return matchesCategory && matchesSearch && matchesPrice;
  });
}

const initialState = {
  products,
  currentProduct: null,
  categories,
  brands: [
    { id: 'sony', name: 'Sony' },
    { id: 'canon', name: 'Canon' },
    { id: 'nikon', name: 'Nikon' },
    { id: 'peak-design', name: 'Peak Design' },
    { id: 'manfrotto', name: 'Manfrotto' },
  ],
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 12, total: products.length, totalPages: 1 },
  filters: {},
};

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      return paginate(applyFilters(products, params), params);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'product/fetchProduct',
  async (id, { rejectWithValue }) => {
    try {
      const product = products.find((item) => item.id === id);
      if (!product) throw new Error('Khong tim thay san pham');
      return product;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCategories = createAsyncThunk('product/fetchCategories', async () => {
  return categories;
});

export const fetchBrands = createAsyncThunk('product/fetchBrands', async () => {
  return initialState.brands;
});

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
        state.error = action.payload || 'Khong the tai san pham';
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
        state.error = action.payload || 'Khong the tai san pham';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setPage, clearCurrentProduct } =
  productSlice.actions;
export default productSlice.reducer;
