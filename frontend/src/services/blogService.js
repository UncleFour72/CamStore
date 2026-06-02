import api, { unwrapData } from './api.js';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85';

export const normalizePost = (post) => {
  if (!post) {
    return null;
  }

  return {
    ...post,
    id: post.slug || String(post.id),
    postId: post.id,
    image: post.cover_image || FALLBACK_IMAGE,
    author: post.author_name,
    readTime: post.read_time || '5 phút đọc',
    date: post.published_at
      ? new Intl.DateTimeFormat('vi-VN').format(new Date(post.published_at))
      : new Intl.DateTimeFormat('vi-VN').format(new Date(post.created_at)),
  };
};

const normalizePagination = (pagination = {}, params = {}) => {
  const pageSize = pagination.limit || params.limit || params.pageSize || 9;

  return {
    page: pagination.page || Number(params.page) || 1,
    pageSize,
    total: pagination.total || 0,
    totalPages: pagination.total_pages || Math.ceil((pagination.total || 0) / pageSize) || 1,
  };
};

export const getBlogs = async (params = {}) => {
  const requestParams = { ...params };

  if (requestParams.pageSize && !requestParams.limit) {
    requestParams.limit = requestParams.pageSize;
  }

  delete requestParams.pageSize;

  if (!requestParams.category || requestParams.category === 'Tất cả') {
    delete requestParams.category;
  }

  const data = await api.get('/blogs', { params: requestParams }).then(unwrapData);

  return {
    items: (data.posts || []).map(normalizePost).filter(Boolean),
    ...normalizePagination(data.pagination, params),
  };
};

export const getFeaturedBlog = async () => {
  const data = await api.get('/blogs/featured', { params: { limit: 1 } }).then(unwrapData);
  return normalizePost((data.posts || [])[0]);
};

export const getBlog = async (slug) => {
  const data = await api.get(`/blogs/${slug}`).then(unwrapData);
  return normalizePost(data.post);
};

export const subscribeNewsletter = async (email) => {
  return api.post('/newsletter/subscribe', { email }).then(unwrapData);
};
