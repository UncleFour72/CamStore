export function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getCategoryLabel(category) {
  const labels = {
    camera: 'Máy ảnh',
    lens: 'Ống kính',
    accessory: 'Phụ kiện',
  };

  return labels[category] || 'Sản phẩm';
}
