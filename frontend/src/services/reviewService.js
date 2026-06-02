import api, { unwrapData } from './api.js';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeReview = (review) => {
  if (!review) {
    return null;
  }

  return {
    ...review,
    id: review.id,
    productId: review.product_id,
    orderId: review.order_id,
    userName: review.user_name || `Khách hàng #${review.user_id}`,
    rating: toNumber(review.rating),
    comment: review.comment || '',
    createdAt: review.created_at
      ? new Intl.DateTimeFormat('vi-VN').format(new Date(review.created_at))
      : '',
    images: (review.images || []).map((image) => image.image_url).filter(Boolean),
  };
};

const normalizePagination = (pagination = {}, params = {}) => {
  const pageSize = pagination.limit || params.limit || params.pageSize || 5;

  return {
    page: pagination.page || Number(params.page) || 1,
    pageSize,
    total: pagination.total || 0,
    totalPages: pagination.total_pages || Math.ceil((pagination.total || 0) / pageSize) || 1,
  };
};

export const getProductReviews = async (productId, params = {}) => {
  const requestParams = { ...params };

  if (requestParams.pageSize && !requestParams.limit) {
    requestParams.limit = requestParams.pageSize;
  }

  delete requestParams.pageSize;

  const data = await api.get(`/products/${productId}/reviews`, { params: requestParams }).then(unwrapData);

  return {
    items: (data.reviews || []).map(normalizeReview).filter(Boolean),
    ...normalizePagination(data.pagination, params),
  };
};

export const createReview = async ({ productId, orderId, rating, comment, images = [] }) => {
  const data = await api
    .post('/reviews', {
      product_id: productId,
      order_id: orderId,
      rating,
      comment,
      images,
    })
    .then(unwrapData);

  return normalizeReview(data.review);
};
