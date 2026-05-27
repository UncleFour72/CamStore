import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { mockOrders } from '../../data/catalog.js';

const ORDER_KEY = 'camstore_orders';

function readOrders() {
  try {
    const stored = localStorage.getItem(ORDER_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Fall through to demo orders.
  }

  return mockOrders.map((order) => ({
    ...order,
    customerName: 'Nguyen Van A',
    shippingAddress: '12 Nguyen Hue, Quan 1, Ho Chi Minh',
    phoneNumber: '0901 234 567',
  }));
}

function saveOrders(orders) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  return orders;
}

function paginate(items, params = {}) {
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 10;
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
  orders: readOrders(),
  currentOrder: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
};

export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      return paginate(readOrders(), params);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'order/fetchOrder',
  async (id, { rejectWithValue }) => {
    try {
      const order = readOrders().find((item) => item.id === id);
      if (!order) throw new Error('Khong tim thay don hang');
      return order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (data, { rejectWithValue }) => {
    try {
      const nextOrder = {
        id: `CS-${Date.now().toString().slice(-5)}`,
        date: new Intl.DateTimeFormat('vi-VN').format(new Date()),
        status: 'Cho xac nhan',
        total: data.total || 0,
        items: data.items || [],
        shippingAddress: data.shippingAddress,
        phoneNumber: data.phoneNumber,
        customerName: data.customerName,
      };

      const orders = [nextOrder, ...readOrders()];
      saveOrders(orders);
      return nextOrder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (id, { rejectWithValue }) => {
    try {
      const orders = readOrders();
      const index = orders.findIndex((order) => order.id === id);
      if (index === -1) throw new Error('Khong tim thay don hang');

      const canceledOrder = { ...orders[index], status: 'Da huy' };
      orders[index] = canceledOrder;
      saveOrders(orders);
      return canceledOrder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Khong the tai don hang';
      })
      .addCase(fetchOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Khong the tai don hang';
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
        state.orders.unshift(action.payload);
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((order) => order.id === action.payload.id);
        if (index > -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      });
  },
});

export const { clearCurrentOrder, clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;
