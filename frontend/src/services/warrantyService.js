import api, { unwrapData } from './api.js';

const formatDate = (value) => {
  if (!value) {
    return 'Đang cập nhật';
  }

  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
};

export const normalizeWarranty = (warranty) => ({
  ...warranty,
  code: warranty.warranty_code,
  productName: warranty.product_name,
  orderNumber: warranty.order_number,
  serialNumber: warranty.serial_number || 'Chưa có serial',
  customerName: warranty.customer_name,
  customerPhone: warranty.customer_phone,
  startDate: formatDate(warranty.start_date),
  endDate: formatDate(warranty.end_date),
});

export const lookupWarranties = async (query) => {
  const data = await api.get('/warranties/lookup', { params: { query } }).then(unwrapData);
  return (data.warranties || []).map(normalizeWarranty);
};
