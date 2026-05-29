import { fetchProductSnapshot } from '../clients/productClient.js';
import { Cart, CartItem, sequelize } from '../models/index.js';

const toPositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const serializeCart = (cart) => {
  const rawItems = cart?.items || [];
  const items = rawItems.map((item) => {
    const quantity = Number(item.quantity);
    const productPrice = Number(item.product_price);

    return {
      id: item.id,
      cart_id: item.cart_id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: productPrice,
      product_image: item.product_image,
      quantity,
      subtotal: productPrice * quantity,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: cart?.id || null,
    user_id: cart?.user_id || null,
    items,
    subtotal,
    total_items: totalItems,
    created_at: cart?.created_at || null,
    updated_at: cart?.updated_at || null,
  };
};

const findCartWithItems = async (userId, options = {}) => {
  return Cart.findOne({
    where: { user_id: userId },
    include: [
      {
        model: CartItem,
        as: 'items',
        separate: true,
        order: [['created_at', 'DESC']],
      },
    ],
    ...options,
  });
};

const getOrCreateCart = async (userId, transaction) => {
  const [cart] = await Cart.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId },
    transaction,
  });

  return cart;
};

const getUserIdFromRequest = (req) => Number(req.auth.id);

const assertProductStock = (snapshot, desiredQuantity) => {
  if (snapshot.stock_quantity < desiredQuantity) {
    const error = new Error('Requested quantity exceeds available stock');
    error.statusCode = 400;
    throw error;
  }
};

export const getCart = async (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);
    const cart = await findCartWithItems(userId);

    if (!cart) {
      return res.json({
        cart: serializeCart({
          id: null,
          user_id: userId,
          items: [],
        }),
      });
    }

    return res.json({ cart: serializeCart(cart) });
  } catch (error) {
    return next(error);
  }
};

export const addItemToCart = async (req, res, next) => {
  let transaction;

  try {
    const userId = getUserIdFromRequest(req);
    const productId = toPositiveInt(req.body.product_id);
    const quantity = toPositiveInt(req.body.quantity, 1);

    if (!productId) {
      return res.status(400).json({ message: 'product_id must be a positive integer' });
    }

    const snapshot = await fetchProductSnapshot(productId);
    transaction = await sequelize.transaction();
    const cart = await getOrCreateCart(userId, transaction);
    const existing = await CartItem.findOne({
      where: { cart_id: cart.id, product_id: productId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const nextQuantity = (existing?.quantity || 0) + quantity;
    assertProductStock(snapshot, nextQuantity);

    if (existing) {
      await existing.update(
        {
          product_name: snapshot.name,
          product_price: snapshot.price,
          product_image: snapshot.image,
          quantity: nextQuantity,
        },
        { transaction }
      );
    } else {
      await CartItem.create(
        {
          cart_id: cart.id,
          product_id: productId,
          product_name: snapshot.name,
          product_price: snapshot.price,
          product_image: snapshot.image,
          quantity,
        },
        { transaction }
      );
    }

    await transaction.commit();
    transaction = null;

    const updatedCart = await findCartWithItems(userId);
    return res.status(201).json({ cart: serializeCart(updatedCart) });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  let transaction;

  try {
    const userId = getUserIdFromRequest(req);
    const itemId = toPositiveInt(req.params.itemId);
    const quantity = toPositiveInt(req.body.quantity);

    if (!itemId || !quantity) {
      return res.status(400).json({ message: 'itemId and quantity must be positive integers' });
    }

    const cart = await Cart.findOne({ where: { user_id: userId } });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const currentItem = await CartItem.findOne({
      where: { id: itemId, cart_id: cart.id },
    });

    if (!currentItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const snapshot = await fetchProductSnapshot(currentItem.product_id);
    assertProductStock(snapshot, quantity);

    transaction = await sequelize.transaction();
    const item = await CartItem.findOne({
      where: { id: itemId, cart_id: cart.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await item.update(
      {
        product_name: snapshot.name,
        product_price: snapshot.price,
        product_image: snapshot.image,
        quantity,
      },
      { transaction }
    );

    await transaction.commit();
    transaction = null;

    const updatedCart = await findCartWithItems(userId);
    return res.json({ cart: serializeCart(updatedCart) });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);
    const itemId = toPositiveInt(req.params.itemId);

    if (!itemId) {
      return res.status(400).json({ message: 'itemId must be a positive integer' });
    }

    const cart = await Cart.findOne({ where: { user_id: userId } });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const deletedCount = await CartItem.destroy({
      where: { id: itemId, cart_id: cart.id },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const updatedCart = await findCartWithItems(userId);
    return res.json({ cart: serializeCart(updatedCart) });
  } catch (error) {
    return next(error);
  }
};

const clearCartByUserId = async (userId) => {
  const cart = await Cart.findOne({ where: { user_id: userId } });

  if (!cart) {
    return 0;
  }

  return CartItem.destroy({ where: { cart_id: cart.id } });
};

export const clearCart = async (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);
    await clearCartByUserId(userId);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const getCartForUser = async (req, res, next) => {
  try {
    const userId = toPositiveInt(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: 'userId must be a positive integer' });
    }

    const cart = await findCartWithItems(userId);

    if (!cart) {
      return res.json({
        cart: serializeCart({
          id: null,
          user_id: userId,
          items: [],
        }),
      });
    }

    return res.json({ cart: serializeCart(cart) });
  } catch (error) {
    return next(error);
  }
};

export const clearCartForUser = async (req, res, next) => {
  try {
    const userId = toPositiveInt(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: 'userId must be a positive integer' });
    }

    await clearCartByUserId(userId);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
