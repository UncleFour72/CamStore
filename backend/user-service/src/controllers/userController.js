import { Op } from 'sequelize';
import { Address, sequelize, User } from '../models/index.js';

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

const requiredAddressFields = ['full_name', 'phone', 'address_line', 'ward', 'district', 'city'];

const validateAddressPayload = (payload) => {
  const missing = requiredAddressFields.filter((field) => !String(payload[field] || '').trim());
  return missing;
};

export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = buildPagination(req.query);
    const { search, role, is_active } = req.query;
    const where = {};

    if (search) {
      const keyword = `%${String(search).trim()}%`;
      where[Op.or] = [
        { email: { [Op.like]: keyword } },
        { first_name: { [Op.like]: keyword } },
        { last_name: { [Op.like]: keyword } },
        { phone: { [Op.like]: keyword } },
      ];
    }

    if (role && ['customer', 'admin'].includes(role)) {
      where.role = role;
    }

    if (is_active !== undefined) {
      where.is_active = ['true', '1', true, 1].includes(is_active);
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      users: rows,
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

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Address,
          as: 'addresses',
          separate: true,
          order: [
            ['is_default', 'DESC'],
            ['created_at', 'DESC'],
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active boolean is required' });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.id === req.user.id && !is_active) {
      return res.status(400).json({ message: 'Admins cannot disable their own account' });
    }

    await user.update({ is_active });

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({
      where: { user_id: req.user.id },
      order: [
        ['is_default', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    return res.json({ addresses });
  } catch (error) {
    return next(error);
  }
};

export const createAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const payload = pick(req.body, [...requiredAddressFields, 'is_default']);
    const missing = validateAddressPayload(payload);

    if (missing.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: `Missing address fields: ${missing.join(', ')}` });
    }

    const existingCount = await Address.count({
      where: { user_id: req.user.id },
      transaction,
    });

    const makeDefault = Boolean(payload.is_default) || existingCount === 0;

    if (makeDefault) {
      await Address.update(
        { is_default: false },
        { where: { user_id: req.user.id }, transaction }
      );
    }

    const address = await Address.create(
      {
        ...payload,
        user_id: req.user.id,
        is_default: makeDefault,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({ address });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      transaction,
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Address not found' });
    }

    const payload = pick(req.body, [...requiredAddressFields, 'is_default']);

    if (payload.is_default === true) {
      await Address.update(
        { is_default: false },
        {
          where: {
            user_id: req.user.id,
            id: { [Op.ne]: address.id },
          },
          transaction,
        }
      );
    }

    await address.update(payload, { transaction });
    await transaction.commit();

    return res.json({ address });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      transaction,
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = address.is_default;
    await address.destroy({ transaction });

    if (wasDefault) {
      const replacement = await Address.findOne({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
        transaction,
      });

      if (replacement) {
        await replacement.update({ is_default: true }, { transaction });
      }
    }

    await transaction.commit();

    return res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      transaction,
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Address not found' });
    }

    await Address.update(
      { is_default: false },
      { where: { user_id: req.user.id }, transaction }
    );
    await address.update({ is_default: true }, { transaction });

    await transaction.commit();

    return res.json({ address });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};
