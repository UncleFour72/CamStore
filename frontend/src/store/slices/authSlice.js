import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as authService from '../../services/authService.js';
import { REFRESH_TOKEN_KEY, TOKEN_KEY, USER_KEY } from '../../services/api.js';

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  const fullName =
    user.name ||
    user.full_name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    user.email;

  return {
    ...user,
    name: fullName,
  };
};

const saveSession = ({ user, token }) => {
  const normalizedUser = normalizeUser(user);

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (normalizedUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  }

  localStorage.removeItem(REFRESH_TOKEN_KEY);

  return normalizedUser;
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const initialUser = readJson(USER_KEY, null);

const initialState = {
  user: initialUser,
  token: localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  error: null,
  isAuthenticated: Boolean(initialUser || localStorage.getItem(TOKEN_KEY)),
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      return {
        user: saveSession(response),
        token: response.token,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Đăng ký thất bại'));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.login(payload);
      return {
        user: saveSession(response),
        token: response.token,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Đăng nhập thất bại'));
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      const user = normalizeUser(response.user);

      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }

      return user;
    } catch (error) {
      clearSession();
      return rejectWithValue(getErrorMessage(error, 'Không thể lấy thông tin tài khoản'));
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(payload);
      const user = normalizeUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể cập nhật hồ sơ'));
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(payload);
      return response.message || 'Đổi mật khẩu thành công';
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Không thể đổi mật khẩu'));
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  clearSession();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const user = normalizeUser(action.payload?.user || null);
      const token = action.payload?.token || state.token;

      state.user = user;
      state.token = token;
      state.isAuthenticated = Boolean(user || token);

      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }

      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.isLoading = true;
      state.error = null;
    };
    const rejected = (fallback) => (state, action) => {
      state.isLoading = false;
      state.error = action.payload || fallback;
    };
    const applySession = (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token || localStorage.getItem(TOKEN_KEY);
      state.isAuthenticated = true;
    };

    builder
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, applySession)
      .addCase(registerUser.rejected, rejected('Đăng ký thất bại'))
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, applySession)
      .addCase(loginUser.rejected, rejected('Đăng nhập thất bại'))
      .addCase(getProfile.pending, pending)
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.token = localStorage.getItem(TOKEN_KEY);
        state.isAuthenticated = Boolean(action.payload || state.token);
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload || null;
      })
      .addCase(updateProfile.pending, pending)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, rejected('Không thể cập nhật hồ sơ'))
      .addCase(changePassword.pending, pending)
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, rejected('Không thể đổi mật khẩu'))
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
