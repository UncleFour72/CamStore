import { Op } from 'sequelize';
import { BlogPost, NewsletterSubscriber, sequelize } from '../models/index.js';

const postFields = [
  'title',
  'slug',
  'excerpt',
  'content',
  'category',
  'cover_image',
  'author_id',
  'author_name',
  'read_time',
  'is_featured',
  'is_published',
  'published_at',
];

const toPositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (['true', '1', 'yes', 'on'].includes(String(value).toLowerCase())) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(String(value).toLowerCase())) {
    return false;
  }

  return fallback;
};

const buildPagination = (query) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const pick = (source, keys) => {
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

const stripFormatting = (value) => {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`~>\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const estimateReadTime = (content) => {
  const text = stripFormatting(content);
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} phut doc`;
};

const getSortOrder = (sort = 'newest') => {
  const sortMap = {
    newest: [
      ['published_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
    latest: [
      ['published_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
    oldest: [
      ['published_at', 'ASC'],
      ['created_at', 'ASC'],
    ],
    featured: [
      ['is_featured', 'DESC'],
      ['published_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
    title: [['title', 'ASC']],
  };

  return sortMap[sort] || sortMap.newest;
};

const findUniqueSlug = async (baseSlug, currentId = null) => {
  const root = makeSlug(baseSlug);

  if (!root) {
    return '';
  }

  let candidate = root;
  let suffix = 2;

  while (true) {
    const where = { slug: candidate };

    if (currentId) {
      where.id = { [Op.ne]: currentId };
    }

    const existing = await BlogPost.findOne({ attributes: ['id'], where });

    if (!existing) {
      return candidate;
    }

    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const resolveAuthorSnapshot = (req, body = {}) => {
  const fullName = [req.auth?.first_name, req.auth?.last_name].filter(Boolean).join(' ').trim();

  return {
    author_id: toPositiveInt(body.author_id, toPositiveInt(req.auth?.id)),
    author_name:
      String(body.author_name || '').trim() ||
      fullName ||
      req.auth?.email ||
      req.auth?.username ||
      'CamStore Admin',
  };
};

const normalizePostPayload = async ({ body, req, existingPost = null, forCreate = false }) => {
  const payload = pick(body, postFields);

  if (body.cover_image_url !== undefined && payload.cover_image === undefined) {
    payload.cover_image = body.cover_image_url;
  }

  if (payload.title !== undefined) {
    payload.title = String(payload.title).trim();
  }

  if (payload.category !== undefined) {
    payload.category = String(payload.category).trim();
  }

  if (payload.excerpt !== undefined) {
    payload.excerpt = payload.excerpt ? String(payload.excerpt).trim() : null;
  }

  if (payload.content !== undefined) {
    payload.content = String(payload.content).trim();
  }

  if (payload.cover_image !== undefined) {
    payload.cover_image = payload.cover_image ? String(payload.cover_image).trim() : null;
  }

  if (forCreate) {
    const author = resolveAuthorSnapshot(req, body);
    payload.author_id = author.author_id;
    payload.author_name = author.author_name;
  } else {
    if (body.author_id !== undefined) {
      payload.author_id = toPositiveInt(body.author_id);
    }

    if (body.author_name !== undefined) {
      payload.author_name = String(body.author_name).trim();
    }
  }

  if (payload.slug !== undefined || forCreate) {
    const slugSource = payload.slug || payload.title || existingPost?.title;
    payload.slug = await findUniqueSlug(slugSource, existingPost?.id);
  }

  if (payload.read_time !== undefined) {
    payload.read_time = payload.read_time ? String(payload.read_time).trim() : null;
  } else if (payload.content !== undefined || forCreate) {
    payload.read_time = estimateReadTime(payload.content || existingPost?.content || '');
  }

  if (payload.is_featured !== undefined) {
    payload.is_featured = toBoolean(payload.is_featured);
  }

  if (payload.is_published !== undefined) {
    payload.is_published = toBoolean(payload.is_published);

    if (payload.is_published) {
      payload.published_at = payload.published_at || existingPost?.published_at || new Date();
    } else {
      payload.published_at = null;
    }
  } else if (forCreate) {
    payload.is_published = false;
    payload.published_at = null;
  }

  if (payload.published_at !== undefined && payload.published_at !== null) {
    const parsed = new Date(payload.published_at);

    if (Number.isNaN(parsed.getTime())) {
      const error = new Error('published_at must be a valid date');
      error.statusCode = 400;
      throw error;
    }

    payload.published_at = parsed;
  }

  return payload;
};

const validatePostPayload = (payload, forCreate = false) => {
  if (forCreate && !payload.title) {
    return 'title is required';
  }

  if (forCreate && !payload.content) {
    return 'content is required';
  }

  if (forCreate && !payload.category) {
    return 'category is required';
  }

  if (forCreate && !payload.author_id) {
    return 'author_id is required';
  }

  if (payload.title !== undefined && !payload.title) {
    return 'title cannot be empty';
  }

  if (payload.content !== undefined && !payload.content) {
    return 'content cannot be empty';
  }

  if (payload.category !== undefined && !payload.category) {
    return 'category cannot be empty';
  }

  if (payload.slug !== undefined && !payload.slug) {
    return 'slug could not be generated';
  }

  if (payload.author_id !== undefined && !payload.author_id) {
    return 'author_id must be a positive integer';
  }

  if (payload.author_name !== undefined && !payload.author_name) {
    return 'author_name cannot be empty';
  }

  return null;
};

const buildPostWhere = ({ query, isAdmin = false }) => {
  const where = {};
  const { category, search, featured, status, include_unpublished } = query;

  if (isAdmin) {
    if (status === 'published') {
      where.is_published = true;
    } else if (status === 'draft' || status === 'unpublished') {
      where.is_published = false;
    }
  } else if (include_unpublished === 'true') {
    where.is_published = true;
  } else {
    where.is_published = true;
  }

  if (category && !['all', 'tat-ca'].includes(makeSlug(category))) {
    where.category = String(category).trim();
  }

  if (featured !== undefined) {
    where.is_featured = toBoolean(featured);
  }

  if (search) {
    const keyword = `%${String(search).trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: keyword } },
      { excerpt: { [Op.like]: keyword } },
      { content: { [Op.like]: keyword } },
      { category: { [Op.like]: keyword } },
      { author_name: { [Op.like]: keyword } },
    ];
  }

  return where;
};

const unsetOtherFeaturedPosts = async (postId, transaction) => {
  await BlogPost.update(
    { is_featured: false },
    {
      where: {
        id: postId ? { [Op.ne]: postId } : { [Op.gt]: 0 },
        is_featured: true,
      },
      transaction,
    }
  );
};

export const getPosts = async (req, res, next) => {
  try {
    const { page, limit, offset } = buildPagination(req.query);
    const where = buildPostWhere({ query: req.query, isAdmin: false });

    const { rows, count } = await BlogPost.findAndCountAll({
      where,
      limit,
      offset,
      order: getSortOrder(req.query.sort),
    });

    return res.json({
      posts: rows,
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

export const getPostsAdmin = async (req, res, next) => {
  try {
    const { page, limit, offset } = buildPagination(req.query);
    const where = buildPostWhere({ query: req.query, isAdmin: true });

    if (req.query.author_id) {
      where.author_id = toPositiveInt(req.query.author_id);
    }

    const { rows, count } = await BlogPost.findAndCountAll({
      where,
      limit,
      offset,
      order: getSortOrder(req.query.sort),
    });

    return res.json({
      posts: rows,
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

export const getFeaturedPosts = async (req, res, next) => {
  try {
    const limit = Math.min(toPositiveInt(req.query.limit, 3), 10);
    const posts = await BlogPost.findAll({
      where: {
        is_published: true,
        is_featured: true,
      },
      limit,
      order: getSortOrder('featured'),
    });

    return res.json({ posts });
  } catch (error) {
    return next(error);
  }
};

export const getPostByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const where = Number.isInteger(Number(idOrSlug))
      ? { id: Number(idOrSlug) }
      : { slug: idOrSlug };

    if (!(req.auth?.role === 'admin' && req.query.include_unpublished === 'true')) {
      where.is_published = true;
    }

    const post = await BlogPost.findOne({ where });

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    return res.json({ post });
  } catch (error) {
    return next(error);
  }
};

export const createPost = async (req, res, next) => {
  let transaction;

  try {
    const payload = await normalizePostPayload({ body: req.body, req, forCreate: true });
    const validationError = validatePostPayload(payload, true);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    transaction = await sequelize.transaction();

    if (payload.is_featured) {
      await unsetOtherFeaturedPosts(null, transaction);
    }

    const post = await BlogPost.create(payload, { transaction });
    await transaction.commit();
    transaction = null;

    return res.status(201).json({ post });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const updatePost = async (req, res, next) => {
  let transaction;

  try {
    const post = await BlogPost.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const payload = await normalizePostPayload({
      body: req.body,
      req,
      existingPost: post,
      forCreate: false,
    });
    const validationError = validatePostPayload(payload, false);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    transaction = await sequelize.transaction();

    if (payload.is_featured) {
      await unsetOtherFeaturedPosts(post.id, transaction);
    }

    await post.update(payload, { transaction });
    await transaction.commit();
    transaction = null;

    return res.json({ post });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    await post.destroy();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const setPostPublishState = async (req, res, next) => {
  try {
    if (req.body.is_published === undefined) {
      return res.status(400).json({ message: 'is_published boolean is required' });
    }

    const post = await BlogPost.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const isPublished = toBoolean(req.body.is_published);
    await post.update({
      is_published: isPublished,
      published_at: isPublished ? post.published_at || new Date() : null,
    });

    return res.json({ post });
  } catch (error) {
    return next(error);
  }
};

export const setPostFeaturedState = async (req, res, next) => {
  let transaction;

  try {
    if (req.body.is_featured === undefined) {
      return res.status(400).json({ message: 'is_featured boolean is required' });
    }

    const post = await BlogPost.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const isFeatured = toBoolean(req.body.is_featured);
    transaction = await sequelize.transaction();

    if (isFeatured) {
      await unsetOtherFeaturedPosts(post.id, transaction);
    }

    await post.update({ is_featured: isFeatured }, { transaction });
    await transaction.commit();
    transaction = null;

    return res.json({ post });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const subscribeNewsletter = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!isEmail(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    const existing = await NewsletterSubscriber.findOne({ where: { email } });

    if (existing) {
      if (!existing.is_active) {
        await existing.update({
          is_active: true,
          subscribed_at: new Date(),
          unsubscribed_at: null,
        });
      }

      return res.json({ subscriber: existing });
    }

    const subscriber = await NewsletterSubscriber.create({ email });

    return res.status(201).json({ subscriber });
  } catch (error) {
    return next(error);
  }
};

export const unsubscribeNewsletter = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email || req.query.email);

    if (!isEmail(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    const subscriber = await NewsletterSubscriber.findOne({ where: { email } });

    if (!subscriber) {
      return res.status(404).json({ message: 'Newsletter subscriber not found' });
    }

    await subscriber.update({
      is_active: false,
      unsubscribed_at: new Date(),
    });

    return res.json({ subscriber });
  } catch (error) {
    return next(error);
  }
};

export const getNewsletterSubscribers = async (req, res, next) => {
  try {
    const { page, limit, offset } = buildPagination(req.query);
    const where = {};

    if (req.query.status === 'active') {
      where.is_active = true;
    } else if (req.query.status === 'inactive') {
      where.is_active = false;
    }

    if (req.query.search) {
      where.email = { [Op.like]: `%${String(req.query.search).trim()}%` };
    }

    const { rows, count } = await NewsletterSubscriber.findAndCountAll({
      where,
      limit,
      offset,
      order: [['subscribed_at', 'DESC']],
    });

    return res.json({
      subscribers: rows,
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

export const setSubscriberActive = async (req, res, next) => {
  try {
    if (req.body.is_active === undefined) {
      return res.status(400).json({ message: 'is_active boolean is required' });
    }

    const subscriber = await NewsletterSubscriber.findByPk(req.params.id);

    if (!subscriber) {
      return res.status(404).json({ message: 'Newsletter subscriber not found' });
    }

    const isActive = toBoolean(req.body.is_active);
    await subscriber.update({
      is_active: isActive,
      subscribed_at: isActive ? new Date() : subscriber.subscribed_at,
      unsubscribed_at: isActive ? null : new Date(),
    });

    return res.json({ subscriber });
  } catch (error) {
    return next(error);
  }
};
