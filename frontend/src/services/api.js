import axios from 'axios';

export const TOKEN_KEY = 'camstore_access_token';
export const REFRESH_TOKEN_KEY = 'camstore_refresh_token';
export const USER_KEY = 'camstore_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

const MESSAGE_MAP = {
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'User account is disabled': 'Tài khoản đã bị khóa. Vui lòng liên hệ CamStore.',
  'Email is already registered': 'Email này đã được đăng ký.',
  'Password must contain at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự.',
  'Current password is incorrect': 'Mật khẩu hiện tại không đúng.',
  'Authentication token is required': 'Vui lòng đăng nhập để tiếp tục.',
  'Invalid or expired token': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'Cart is empty': 'Giỏ hàng đang trống.',
  'Product not found': 'Không tìm thấy sản phẩm.',
  'Order not found': 'Không tìm thấy đơn hàng.',
  'You cannot access this order': 'Bạn không có quyền xem đơn hàng này.',
  'You cannot cancel this order': 'Bạn không có quyền hủy đơn hàng này.',
  'Only pending orders can be cancelled by customers': 'Chỉ có thể hủy đơn hàng đang chờ xác nhận.',
  'Only pending unpaid orders can be paid or changed': 'Chỉ có thể thanh toán hoặc đổi phương thức với đơn đang chờ và chưa thanh toán.',
  'Only online orders can use online payment retry': 'Chỉ đơn online mới có thể thanh toán lại.',
  'This order has already been paid': 'Đơn hàng này đã được thanh toán.',
  'Order status changed and can no longer be cancelled': 'Trạng thái đơn hàng đã thay đổi nên không thể hủy.',
};

const normalizeErrorMessage = (error) => {
  if (error.code === 'ECONNABORTED') {
    error.message = 'Kết nối tới máy chủ quá lâu. Vui lòng thử lại.';
  } else if (!error.response) {
    error.message = 'Không kết nối được tới API Gateway. Hãy kiểm tra backend đang chạy.';
  }

  const message = error.response?.data?.message;

  if (message && MESSAGE_MAP[message]) {
    error.response.data.message = MESSAGE_MAP[message];
  } else if (message?.startsWith('Orders can only be cancelled within')) {
    error.response.data.message = 'Đơn pending chỉ hủy trực tiếp trong 60 phút sau khi đặt.';
  }

  return error;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    normalizeErrorMessage(error);

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export const unwrapData = (response) => response.data;

export default api;
