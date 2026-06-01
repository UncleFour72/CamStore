import api, { unwrapData } from './api.js';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildProductParams = (params = {}) => {
  const result = { ...params };

  if (result.pageSize && !result.limit) {
    result.limit = result.pageSize;
  }

  if (result.minPrice !== undefined) {
    result.min_price = result.minPrice;
  }

  if (result.maxPrice !== undefined) {
    result.max_price = result.maxPrice;
  }

  if (result.category === 'all' || result.category === '') {
    delete result.category;
  }

  delete result.pageSize;
  delete result.minPrice;
  delete result.maxPrice;

  Object.keys(result).forEach((key) => {
    if (result[key] === '' || result[key] === null || result[key] === undefined) {
      delete result[key];
    }
  });

  return result;
};

export const normalizeCategory = (category) => {
  if (!category) {
    return null;
  }

  return {
    ...category,
    id: category.slug || String(category.id),
    categoryId: category.id,
    title: category.name,
    image: category.image_url,
  };
};

export const normalizeProduct = (product) => {
  if (!product) {
    return null;
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const gallery = images.map((image) => image.image_url).filter(Boolean);
  const primaryImage = images.find((image) => image.is_primary)?.image_url || gallery[0] || FALLBACK_IMAGE;
  const category = normalizeCategory(product.category);
  const price = toNumber(product.price);
  const originalPrice = toNumber(product.original_price, price);

  return {
    ...product,
    id: product.slug || String(product.id),
    productId: product.id,
    apiId: product.id,
    fullName: product.name,
    detailName: product.name,
    category: category?.id || String(product.category_id || ''),
    categoryName: category?.name || '',
    productType: category?.name || product.condition || '',
    image: primaryImage,
    gallery: gallery.length > 0 ? gallery : [primaryImage],
    tagline: product.short_description || product.description || '',
    eyebrow: product.brand,
    price,
    detailPrice: price,
    oldPrice: originalPrice,
    stock: Number.isInteger(product.stock_quantity) ? product.stock_quantity : toNumber(product.stock_quantity),
    rating: toNumber(product.average_rating),
    reviews: Number.isInteger(product.total_reviews) ? product.total_reviews : toNumber(product.total_reviews),
    specs: Array.isArray(product.specs)
      ? product.specs.map((spec) => [spec.spec_name, spec.spec_value]).filter(([label, value]) => label && value)
      : [],
    rawCategory: category,
  };
};

export const getProducts = async (params = {}) => {
  const data = await api.get('/products', { params: buildProductParams(params) }).then(unwrapData);
  const pagination = data.pagination || {};
  const pageSize = pagination.limit || params.limit || params.pageSize || 20;

  return {
    items: (data.products || []).map(normalizeProduct).filter(Boolean),
    page: pagination.page || Number(params.page) || 1,
    pageSize,
    total: pagination.total || 0,
    totalPages: pagination.total_pages || Math.ceil((pagination.total || 0) / pageSize) || 1,
  };
};

export const getProduct = async (idOrSlug) => {
  const data = await api.get(`/products/${idOrSlug}`).then(unwrapData);
  return normalizeProduct(data.product);
};

export const getCategories = async (params = {}) => {
  const data = await api.get('/categories', { params }).then(unwrapData);
  return (data.categories || []).map(normalizeCategory).filter(Boolean);
};

export const getBrands = async () => {
  const data = await getProducts({ limit: 100, sort: 'popular' });
  const names = [...new Set(data.items.map((product) => product.brand).filter(Boolean))];

  return names.map((name) => ({
    id: name,
    name,
  }));
};
