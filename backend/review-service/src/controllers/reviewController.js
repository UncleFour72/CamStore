import { Op, fn, col } from 'sequelize';
import { assertOrderContainsDeliveredProduct } from '../clients/orderClient.js';
import { updateProductRating } from '../clients/productClient.js';
import { Review, ReviewImage, sequelize } from '../models/index.js';

const toPositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getBearerToken = (req) => {
  const authorization = req.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : null;
};

const normalizeImages = (images = []) => {
  const source = Array.isArray(images) ? images : [];

  return source
    .map((item) => (typeof item === 'string' ? item : item?.image_url || item?.url || item?.src))
    .filter(Boolean)
    .slice(0, 5)
    .map((image_url) => ({ image_url }));
};

const getReviewIncludes = () => [
  {
    model: ReviewImage,
    as: 'images',
    separate: true,
    order: [['id', 'ASC']],
  },
];

const recalculateProductRating = async (productId) => {
  const result = await Review.findOne({
    attributes: [
      [fn('AVG', col('rating')), 'average_rating'],
      [fn('COUNT', col('id')), 'total_reviews'],
    ],
    where: {
      product_id: productId,
      is_active: true,
    },
    raw: true,
  });

  const averageRating = Number(Number(result?.average_rating || 0).toFixed(2));
  const totalReviews = Number(result?.total_reviews || 0);

  await updateProductRating({
    productId,
    averageRating,
    totalReviews,
  });

  return { averageRating, totalReviews };
};

const ensureReviewOwnerOrAdmin = (req, review) => {
  if (req.auth.role === 'admin') {
    return true;
  }

  return Number(review.user_id) === Number(req.auth.id);
};

export const getProductReviews = async (req, res, next) => {
  try {
    const productId = toPositiveInt(req.params.productId || req.query.product_id);

    if (!productId) {
      return res.status(400).json({ message: 'productId must be a positive integer' });
    }

    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;
    const where = { product_id: productId, is_active: true };

    if (req.query.rating) {
      where.rating = toPositiveInt(req.query.rating);
    }

    const { rows, count } = await Review.findAndCountAll({
      where,
      include: getReviewIncludes(),
      limit,
      offset,
      distinct: true,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      reviews: rows,
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

export const getMyReviews = async (req, res, next) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await Review.findAndCountAll({
      where: { user_id: req.auth.id },
      include: getReviewIncludes(),
      limit,
      offset,
      distinct: true,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      reviews: rows,
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

export const getReviewsAdmin = async (req, res, next) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;
    const where = {};

    if (req.query.product_id) {
      where.product_id = toPositiveInt(req.query.product_id);
    }

    if (req.query.user_id) {
      where.user_id = toPositiveInt(req.query.user_id);
    }

    if (req.query.rating) {
      where.rating = toPositiveInt(req.query.rating);
    }

    if (req.query.is_active !== undefined) {
      where.is_active = ['true', '1', true, 1].includes(req.query.is_active);
    }

    if (req.query.search) {
      where.comment = { [Op.like]: `%${String(req.query.search).trim()}%` };
    }

    const { rows, count } = await Review.findAndCountAll({
      where,
      include: getReviewIncludes(),
      limit,
      offset,
      distinct: true,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      reviews: rows,
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

export const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id, {
      include: getReviewIncludes(),
    });

    if (!review || (!review.is_active && req.auth?.role !== 'admin')) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.json({ review });
  } catch (error) {
    return next(error);
  }
};

export const createReview = async (req, res, next) => {
  let transaction;

  try {
    const productId = toPositiveInt(req.body.product_id);
    const orderId = toPositiveInt(req.body.order_id);
    const rating = toPositiveInt(req.body.rating);

    if (!productId || !orderId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'product_id, order_id and rating between 1 and 5 are required',
      });
    }

    await assertOrderContainsDeliveredProduct({
      orderId,
      productId,
      userId: req.auth.id,
      token: getBearerToken(req),
    });

    transaction = await sequelize.transaction();
    const review = await Review.create(
      {
        user_id: req.auth.id,
        product_id: productId,
        order_id: orderId,
        rating,
        comment: req.body.comment || null,
        is_active: true,
      },
      { transaction }
    );

    const images = normalizeImages(req.body.images);

    if (images.length > 0) {
      await ReviewImage.bulkCreate(
        images.map((image) => ({ ...image, review_id: review.id })),
        { transaction }
      );
    }

    await transaction.commit();
    transaction = null;

    await recalculateProductRating(productId);

    const created = await Review.findByPk(review.id, { include: getReviewIncludes() });
    return res.status(201).json({ review: created });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const updateReview = async (req, res, next) => {
  let transaction;

  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (!ensureReviewOwnerOrAdmin(req, review)) {
      return res.status(403).json({ message: 'You cannot update this review' });
    }

    const payload = {};

    if (req.body.rating !== undefined) {
      const rating = toPositiveInt(req.body.rating);

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'rating must be between 1 and 5' });
      }

      payload.rating = rating;
    }

    if (req.body.comment !== undefined) {
      payload.comment = req.body.comment || null;
    }

    transaction = await sequelize.transaction();
    await review.update(payload, { transaction });

    if (req.body.images !== undefined) {
      const images = normalizeImages(req.body.images);
      await ReviewImage.destroy({ where: { review_id: review.id }, transaction });

      if (images.length > 0) {
        await ReviewImage.bulkCreate(
          images.map((image) => ({ ...image, review_id: review.id })),
          { transaction }
        );
      }
    }

    await transaction.commit();
    transaction = null;

    await recalculateProductRating(review.product_id);

    const updated = await Review.findByPk(review.id, { include: getReviewIncludes() });
    return res.json({ review: updated });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const setReviewActive = async (req, res, next) => {
  try {
    if (typeof req.body.is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active boolean is required' });
    }

    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.update({ is_active: req.body.is_active });
    await recalculateProductRating(review.product_id);

    return res.json({ review });
  } catch (error) {
    return next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (!ensureReviewOwnerOrAdmin(req, review)) {
      return res.status(403).json({ message: 'You cannot delete this review' });
    }

    await review.update({ is_active: false });
    await recalculateProductRating(review.product_id);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
