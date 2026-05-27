import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY = 'camstore_access_token';
const REFRESH_TOKEN_KEY = 'camstore_refresh_token';
const USER_KEY = 'camstore_user';

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveSession(user) {
  const accessToken = `demo-token-${Date.now()}`;
  const refreshToken = `demo-refresh-${Date.now()}`;

  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return { user, accessToken, refreshToken };
}

const initialUser = readJson(USER_KEY, null);

const initialState = {
  user: initialUser,
  isLoading: false,
  error: null,
  isAuthenticated: Boolean(initialUser || localStorage.getItem(TOKEN_KEY)),
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const user = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'customer',
      };

      return saveSession(user).user;
    } catch (error) {
      return rejectWithValue(error.message || 'Dang ky that bai');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      if (!payload?.email || !payload?.password) {
        throw new Error('Vui long nhap email va mat khau');
      }

      const user = {
        id: 'demo-user',
        name: payload.email.split('@')[0] || 'CamStore User',
        email: payload.email,
        phone: '0901 234 567',
        role: payload.email.includes('admin') ? 'admin' : 'customer',
      };

      return saveSession(user).user;
    } catch (error) {
      return rejectWithValue(error.message || 'Dang nhap that bai');
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = readJson(USER_KEY, null);

      if (!user) {
        throw new Error('Khong tim thay thong tin nguoi dung');
      }

      return user;
    } catch (error) {
      return rejectWithValue(error.message || 'Khong the lay profile');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const user = action.payload?.user || null;
      state.user = user;
      state.isAuthenticated = Boolean(user);

      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Dang ky that bai';
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Dang nhap that bai';
      })
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
