import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as addressService from '../../services/addressService.js';

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

const initialState = {
  addresses: [],
  isLoading: false,
  error: null,
};

export const fetchAddresses = createAsyncThunk(
  'address/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const data = await addressService.getAddresses();
      return data.addresses || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Khong the tai dia chi'));
    }
  }
);

export const createAddress = createAsyncThunk(
  'address/createAddress',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await addressService.createAddress(payload);
      return data.address;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Khong the tao dia chi'));
    }
  }
);

export const updateAddress = createAsyncThunk(
  'address/updateAddress',
  async ({ id, data: payload }, { rejectWithValue }) => {
    try {
      const data = await addressService.updateAddress(id, payload);
      return data.address;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Khong the cap nhat dia chi'));
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'address/deleteAddress',
  async (id, { rejectWithValue }) => {
    try {
      await addressService.deleteAddress(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Khong the xoa dia chi'));
    }
  }
);

export const setDefaultAddress = createAsyncThunk(
  'address/setDefaultAddress',
  async (id, { rejectWithValue }) => {
    try {
      const data = await addressService.setDefaultAddress(id);
      return data.address;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Khong the dat dia chi mac dinh'));
    }
  }
);

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearAddressError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const markPending = (state) => {
      state.isLoading = true;
      state.error = null;
    };
    const markRejected = (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Khong the xu ly dia chi';
    };
    const upsertAddress = (state, address) => {
      if (!address) {
        return;
      }

      if (address.is_default) {
        state.addresses = state.addresses.map((item) => ({ ...item, is_default: false }));
      }

      const index = state.addresses.findIndex((item) => item.id === address.id);

      if (index >= 0) {
        state.addresses[index] = address;
      } else {
        state.addresses.unshift(address);
      }

      state.addresses.sort((a, b) => Number(b.is_default) - Number(a.is_default));
    };

    builder
      .addCase(fetchAddresses.pending, markPending)
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, markRejected)
      .addCase(createAddress.pending, markPending)
      .addCase(createAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        upsertAddress(state, action.payload);
      })
      .addCase(createAddress.rejected, markRejected)
      .addCase(updateAddress.pending, markPending)
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        upsertAddress(state, action.payload);
      })
      .addCase(updateAddress.rejected, markRejected)
      .addCase(deleteAddress.pending, markPending)
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = state.addresses.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteAddress.rejected, markRejected)
      .addCase(setDefaultAddress.pending, markPending)
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        upsertAddress(state, action.payload);
      })
      .addCase(setDefaultAddress.rejected, markRejected);
  },
});

export const { clearAddressError } = addressSlice.actions;
export default addressSlice.reducer;
