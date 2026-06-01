import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as orderService from '../../services/orderService.js';

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

const initialState = {
  orders: [],
  currentOrder: null,
  checkoutResult: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
};

export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await orderService.getOrders(params);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải đơn hàng'));
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'order/fetchOrder',
  async (idOrNumber, { rejectWithValue }) => {
    try {
      const order = await orderService.getOrder(idOrNumber);

      if (!order) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      return order;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tải đơn hàng'));
    }
  }
);

export const checkoutOrder = createAsyncThunk(
  'order/checkout',
  async (payload, { rejectWithValue }) => {
    try {
      return await orderService.checkout(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể đặt hàng'));
    }
  }
);

export const createOrder = checkoutOrder;

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (id, { rejectWithValue }) => {
    try {
      return await orderService.cancelOrder(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể hủy đơn hàng'));
    }
  }
);

export const retryOrderPayment = createAsyncThunk(
  'order/retryPayment',
  async ({ id, paymentMethod }, { rejectWithValue }) => {
    try {
      return await orderService.retryPayment(id, paymentMethod);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể tạo lại liên kết thanh toán'));
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
    clearCheckoutResult: (state) => {
      state.checkoutResult = null;
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
      .addCase(fetchOrders.pending, markPending)
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
      .addCase(fetchOrders.rejected, markRejected('Không thể tải đơn hàng'))
      .addCase(fetchOrder.pending, markPending)
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrder.rejected, markRejected('Không thể tải đơn hàng'))
      .addCase(checkoutOrder.pending, markPending)
      .addCase(checkoutOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.checkoutResult = action.payload;
        state.currentOrder = action.payload.order;

        if (action.payload.order) {
          state.orders = [action.payload.order, ...state.orders.filter((item) => item.id !== action.payload.order.id)];
        }
      })
      .addCase(checkoutOrder.rejected, markRejected('Không thể đặt hàng'))
      .addCase(cancelOrder.pending, markPending)
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex((order) => order.id === action.payload.id);

        if (index > -1) {
          state.orders[index] = action.payload;
        }

        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, markRejected('Không thể hủy đơn hàng'))
      .addCase(retryOrderPayment.pending, markPending)
      .addCase(retryOrderPayment.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.order) {
          const index = state.orders.findIndex((order) => order.id === action.payload.order.id);

          if (index > -1) {
            state.orders[index] = action.payload.order;
          }

          if (state.currentOrder?.id === action.payload.order.id) {
            state.currentOrder = action.payload.order;
          }
        }
      })
      .addCase(retryOrderPayment.rejected, markRejected('Không thể tạo lại liên kết thanh toán'));
  },
});

export const { clearCurrentOrder, clearOrderError, clearCheckoutResult } = orderSlice.actions;
export default orderSlice.reducer;
