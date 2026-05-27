import { Op } from 'sequelize';
import { Category, Product, ProductImage, ProductSpec, Wishlist, sequelize } from '../models/index.js';

const productFields = [
  'name',
  'slug',
  'description',
  'short_description',
  'brand',
  'sku',
  'price',
  'original_price',
  'stock_quantity',
  'category_id',
  'condition',
  'badge',
  'weight',
  'is_active',
];

const categoryFields = ['name', 'slug', 'description', 'parent_id', 'image_url', 'is_active'];

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildPagination = (query) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const pick = (source = {}, keys) => {
  return keys.reduce((result, key) => {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }

    return result;
  }, {});
};

export const makeSlug = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 260);
};

const getProductIncludes = ({ includeSpecs = false } = {}) => {
  const includes = [
    {
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'slug', 'parent_id'],
    },
    {
      model: ProductImage,
      as: 'images',
      separate: true,
      order: [
        ['is_primary', 'DESC'],
        ['sort_order', 'ASC'],
        ['id', 'ASC'],
      ],
    },
  ];

  if (includeSpecs) {
    includes.push({
      model: ProductSpec,
      as: 'specs',
      separate: true,
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  return includes;
};

const normalizeImages = (images = [], fallbackImageUrl = null) => {
  const source = Array.isArray(images) ? images : [];
  const normalized = source
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          image_url: item,
          sort_order: index,
          is_primary: index === 0,
        };
      }

      return {
        image_url: item?.image_url || item?.url || item?.src,
        sort_order: Number.isInteger(item?.sort_order) ? item.sort_order : index,
        is_primary: Boolean(item?.is_primary),
      };
    })
    .filter((item) => item.image_url);

  if (normalized.length === 0 && fallbackImageUrl) {
    normalized.push({
      image_url: fallbackImageUrl,
      sort_order: 0,
      is_primary: true,
    });
  }

  if (normalized.length > 0 && !normalized.some((item) => item.is_primary)) {
    normalized[0].is_primary = true;
  }

  let primarySeen = false;
  return normalized.map((item) => {
    if (item.is_primary && !primarySeen) {
      primarySeen = true;
      return item;
    }

    return { ...item, is_primary: false };
  });
};

const normalizeSpecs = (specs = []) => {
  const source = Array.isArray(specs) ? specs : [];

  return source
    .map((item, index) => {
      if (Array.isArray(item)) {
        return {
          spec_name: item[0],
          spec_value: item[1],
          sort_order: index,
        };
      }

      return {
        spec_name: item?.spec_name || item?.name || item?.label,
        spec_value: item?.spec_value || item?.value,
        sort_order: Number.isInteger(item?.sort_order) ? item.sort_order : index,
      };
    })
    .filter((item) => item.spec_name && item.spec_value);
};

const findCategoryWithChildrenIds = async (idOrSlug) => {
  const categoryWhere = Number.isInteger(Number(idOrSlug))
    ? { id: Number(idOrSlug) }
    : { slug: idOrSlug };
  const category = await Category.findOne({ where: categoryWhere });

  if (!category) {
    return [];
  }

  const categories = await Category.findAll({
    attributes: ['id', 'parent_id'],
    raw: true,
  });

  const ids = new Set([category.id]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const item of categories) {
      if (item.parent_id && ids.has(item.parent_id) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    }
  }

  return [...ids];
};

const getSortOrder = (sort = 'newest') => {
  const sortMap = {
    newest: [['created_at', 'DESC']],
    latest: [['created_at', 'DESC']],
    oldest: [['created_at', 'ASC']],
    'price-low': [['price', 'ASC']],
    price_asc: [['price', 'ASC']],
    'price-high': [['price', 'DESC']],
    price_desc: [['price', 'DESC']],
    rating: [
      ['average_rating', 'DESC'],
      ['total_reviews', 'DESC'],
    ],
    popular: [['total_reviews', 'DESC']],
    stock: [['stock_quantity', 'DESC']],
  };

  return sortMap[sort] || sortMap.newest;
};

const findProductForResponse = async (id, options = {}) => {
  return Product.findByPk(id, {
    include: getProductIncludes({ includeSpecs: true }),
    ...options,
  });
};

const getWishlistIncludes = () => [
  {
    model: Product,
    as: 'product',
    where: { is_active: true },
    include: getProductIncludes({ includeSpecs: false }),
  },
];

const findWishlistItemForResponse = async (id) => {
  return Wishlist.findByPk(id, {
    include: getWishlistIncludes(),
  });
};

export const getProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = buildPagination(req.query);
    const where = {};
    const {
      search,
      category,
      category_id,
      brand,
      condition,
      badge,
      min_price,
      max_price,
      in_stock,
      status,
      include_inactive,
      include_specs,
      sort,
    } = req.query;

    const adminCanSeeInactive = req.auth?.role === 'admin';

    if (adminCanSeeInactive && status === 'inactive') {
      where.is_active = false;
    } else if (adminCanSeeInactive && (status === 'all' || include_inactive === 'true')) {
      // Admin explicitly requested all products.
    } else {
      where.is_active = true;
    }

    if (search) {
      const keyword = `%${String(search).trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: keyword } },
        { brand: { [Op.like]: keyword } },
        { sku: { [Op.like]: keyword } },
        { description: { [Op.like]: keyword } },
        { short_description: { [Op.like]: keyword } },
      ];
    }

    if (brand) {
      where.brand = String(brand).trim();
    }

    if (condition) {
      where.condition = String(condition).trim();
    }

    if (badge) {
      where.badge = String(badge).trim();
    }

    const minPrice = toNumberOrNull(min_price);
    const maxPrice = toNumberOrNull(max_price);

    if (minPrice !== null || maxPrice !== null) {
      where.price = {};

      if (minPrice !== null) {
        where.price[Op.gte] = minPrice;
      }

      if (maxPrice !== null) {
        where.price[Op.lte] = maxPrice;
      }
    }

    if (in_stock === 'true') {
      where.stock_quantity = { [Op.gt]: 0 };
    }

    const categoryFilter = category_id || category;

    if (categoryFilter) {
      const ids = await findCategoryWithChildrenIds(categoryFilter);

      if (ids.length === 0) {
        return res.json({
          products: [],
          pagination: { page, limit, total: 0, total_pages: 0 },
        });
      }

      where.category_id = { [Op.in]: ids };
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      distinct: true,
      include: getProductIncludes({ includeSpecs: include_specs === 'true' }),
      order: getSortOrder(sort),
    });

    return res.json({
      products: rows,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getProductByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const where = Number.isInteger(Number(idOrSlug))
      ? { id: Number(idOrSlug) }
      : { slug: idOrSlug };

    if (!(req.auth?.role === 'admin' && req.query.include_inactive === 'true')) {
      where.is_active = true;
    }

    const product = await Product.findOne({
      where,
      include: getProductIncludes({ includeSpecs: true }),
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({ product });
  } catch (error) {
    return next(error);
  }
};

export const createProduct = async (req, res, next) => {
  let transaction = await sequelize.transaction();

  try {
    const payload = pick(req.body, productFields);
    const category = await Category.findByPk(payload.category_id, { transaction });

    if (!category || !category.is_active) {
      await transaction.rollback();
      return res.status(400).json({ message: 'category_id must reference an active category' });
    }

    payload.slug = makeSlug(payload.slug || payload.name);

    if (!payload.slug) {
      await transaction.rollback();
      return res.status(400).json({ message: 'slug could not be generated from product name' });
    }

    const product = await Product.create(payload, { transaction });
    const images = normalizeImages(req.body.images, req.body.image_url);
    const specs = normalizeSpecs(req.body.specs);

    if (images.length > 0) {
      await ProductImage.bulkCreate(
        images.map((image) => ({ ...image, product_id: product.id })),
        { transaction }
      );
    }

    if (specs.length > 0) {
      await ProductSpec.bulkCreate(
        specs.map((spec) => ({ ...spec, product_id: product.id })),
        { transaction }
      );
    }

    await transaction.commit();
    transaction = null;

    const created = await findProductForResponse(product.id);
    return res.status(201).json({ product: created });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  let transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(req.params.id, { transaction });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    const payload = pick(req.body, productFields);

    if (payload.category_id !== undefined) {
      const category = await Category.findByPk(payload.category_id, { transaction });

      if (!category || !category.is_active) {
        await transaction.rollback();
        return res.status(400).json({ message: 'category_id must reference an active category' });
      }
    }

    if (payload.slug !== undefined) {
      payload.slug = makeSlug(payload.slug);

      if (!payload.slug) {
        await transaction.rollback();
        return res.status(400).json({ message: 'slug must contain at least one valid character' });
      }
    }

    await product.update(payload, { transaction });

    if (req.body.images !== undefined || req.body.image_url !== undefined) {
      const images = normalizeImages(req.body.images, req.body.image_url);

      await ProductImage.destroy({ where: { product_id: product.id }, transaction });

      if (images.length > 0) {
        await ProductImage.bulkCreate(
          images.map((image) => ({ ...image, product_id: product.id })),
          { transaction }
        );
      }
    }

    if (req.body.specs !== undefined) {
      const specs = normalizeSpecs(req.body.specs);

      await ProductSpec.destroy({ where: { product_id: product.id }, transaction });

      if (specs.length > 0) {
        await ProductSpec.bulkCreate(
          specs.map((spec) => ({ ...spec, product_id: product.id })),
          { transaction }
        );
      }
    }

    await transaction.commit();
    transaction = null;

    const updated = await findProductForResponse(product.id);
    return res.json({ product: updated });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update({ is_active: false });

    return res.json({ product });
  } catch (error) {
    return next(error);
  }
};

export const updateStock = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    let nextStock = null;

    if (req.body.stock_quantity !== undefined) {
      nextStock = Number(req.body.stock_quantity);
    } else if (req.body.delta !== undefined) {
      nextStock = product.stock_quantity + Number(req.body.delta);
    } else if (req.body.quantity !== undefined && req.body.operation) {
      const quantity = Number(req.body.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !['increment', 'decrement'].includes(req.body.operation)
      ) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'quantity must be a positive integer and operation must be increment or decrement',
        });
      }

      nextStock =
        req.body.operation === 'decrement'
          ? product.stock_quantity - quantity
          : product.stock_quantity + quantity;
    }

    if (!Number.isInteger(nextStock) || nextStock < 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Invalid stock update or insufficient stock' });
    }

    await product.update({ stock_quantity: nextStock }, { transaction });
    await transaction.commit();

    return res.json({
      product_id: product.id,
      stock_quantity: product.stock_quantity,
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

export const updateRating = async (req, res, next) => {
  try {
    const { average_rating, total_reviews } = req.body;
    const rating = Number(average_rating);
    const reviews = Number.parseInt(total_reviews, 10);

    if (!Number.isFinite(rating) || rating < 0 || rating > 5 || !Number.isInteger(reviews) || reviews < 0) {
      return res.status(400).json({
        message: 'average_rating must be between 0 and 5, total_reviews must be non-negative',
      });
    }

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update({
      average_rating: Number(rating.toFixed(2)),
      total_reviews: reviews,
    });

    return res.json({ product });
  } catch (error) {
    return next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const where = {};

    if (!(req.auth?.role === 'admin' && req.query.include_inactive === 'true')) {
      where.is_active = true;
    }

    const categories = await Category.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug', 'image_url', 'is_active'],
          required: false,
        },
      ],
      order: [
        ['parent_id', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return res.json({ categories });
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const payload = pick(req.body, categoryFields);
    payload.slug = makeSlug(payload.slug || payload.name);

    if (!payload.slug) {
      return res.status(400).json({ message: 'slug could not be generated from category name' });
    }

    if (payload.parent_id) {
      const parent = await Category.findByPk(payload.parent_id);

      if (!parent) {
        return res.status(400).json({ message: 'parent_id must reference an existing category' });
      }
    }

    const category = await Category.create(payload);

    return res.status(201).json({ category });
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const payload = pick(req.body, categoryFields);

    if (payload.slug !== undefined) {
      payload.slug = makeSlug(payload.slug);

      if (!payload.slug) {
        return res.status(400).json({ message: 'slug must contain at least one valid character' });
      }
    }

    if (payload.parent_id !== undefined) {
      if (Number(payload.parent_id) === category.id) {
        return res.status(400).json({ message: 'A category cannot be its own parent' });
      }

      if (payload.parent_id) {
        const parent = await Category.findByPk(payload.parent_id);

        if (!parent) {
          return res.status(400).json({ message: 'parent_id must reference an existing category' });
        }
      }
    }

    await category.update(payload);

    return res.json({ category });
  } catch (error) {
    return next(error);
  }
};

export const getWishlist = async (req, res, next) => {
  try {
    const wishlists = await Wishlist.findAll({
      where: { user_id: req.auth.id },
      include: getWishlistIncludes(),
      order: [['created_at', 'DESC']],
    });

    return res.json({
      wishlists,
      products: wishlists.map((item) => item.product).filter(Boolean),
    });
  } catch (error) {
    return next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const productId = toPositiveInt(req.body.product_id || req.body.productId);

    if (!productId) {
      return res.status(400).json({ message: 'product_id must be a positive integer' });
    }

    const product = await Product.findOne({
      where: {
        id: productId,
        is_active: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [wishlist, created] = await Wishlist.findOrCreate({
      where: {
        user_id: req.auth.id,
        product_id: productId,
      },
      defaults: {
        user_id: req.auth.id,
        product_id: productId,
      },
    });
    const item = await findWishlistItemForResponse(wishlist.id);

    return res.status(created ? 201 : 200).json({
      wishlist: item,
      product: item?.product || product,
    });
  } catch (error) {
    return next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const productId = toPositiveInt(req.params.productId);

    if (!productId) {
      return res.status(400).json({ message: 'productId must be a positive integer' });
    }

    await Wishlist.destroy({
      where: {
        user_id: req.auth.id,
        product_id: productId,
      },
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
