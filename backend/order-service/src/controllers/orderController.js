import { Op } from 'sequelize';
import { clearCartForUser, getCartForUser } from '../clients/cartClient.js';
import {
  completeCodPaymentForDelivery,
  createPayment,
  getPaymentByOrderId,
  retryPayment,
} from '../clients/paymentClient.js';
import { notifyAdmin, notifyUser } from '../clients/notificationClient.js';
import { decrementStock, getProductSnapshot, incrementStock } from '../clients/productClient.js';
import { Order, OrderItem, OrderStatusHistory, sequelize, Warranty } from '../models/index.js';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
const ORDER_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'shipping', 'delivered', 'cancelled'],
  processing: ['shipping', 'delivered', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};
const ONLINE_PAYMENT_METHODS = ['cod', 'vnpay', 'momo', 'bank_transfer'];
const INSTORE_PAYMENT_METHODS = ['cash', 'bank_transfer', 'pos_card'];
const PREPAID_ONLINE_PAYMENT_METHODS = ['vnpay', 'momo', 'bank_transfer'];
const CUSTOMER_CANCEL_WINDOW_MINUTES = Number(process.env.CUSTOMER_CANCEL_WINDOW_MINUTES || 60);
const SHIPPING_FIELDS = [
  'shipping_name',
  'shipping_phone',
  'shipping_address',
  'shipping_ward',
  'shipping_district',
  'shipping_city',
];

const toPositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toMoney = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
};

const pick = (source, keys) => {
  return keys.reduce((result, key) => {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }

    return result;
  }, {});
};

const generateOrderNumber = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const stamp = `${yyyy}${mm}${dd}`;
  const entropy = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

  return `ORD-${stamp}-${entropy}`;
};

const generateWarrantyCode = (orderId, itemId, sequence) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return `WR-${yyyy}${mm}${dd}-${orderId}-${itemId}-${sequence}`;
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const getOrderIncludes = ({ includeHistory = true, includeWarranties = true } = {}) => {
  const includes = [
    {
      model: OrderItem,
      as: 'items',
      separate: true,
      order: [['id', 'ASC']],
    },
  ];

  if (includeHistory) {
    includes.push({
      model: OrderStatusHistory,
      as: 'status_history',
      separate: true,
      order: [['changed_at', 'ASC']],
    });
  }

  if (includeWarranties) {
    includes.push({
      model: Warranty,
      as: 'warranties',
      separate: true,
      order: [['created_at', 'ASC']],
    });
  }

  return includes;
};

const findOrderByIdOrNumber = async (idOrNumber, options = {}) => {
  const where = Number.isInteger(Number(idOrNumber))
    ? { id: Number(idOrNumber) }
    : { order_number: idOrNumber };

  return Order.findOne({
    where,
    include: getOrderIncludes(),
    ...options,
  });
};

const toPlainOrder = (order) => (typeof order?.get === 'function' ? order.get({ plain: true }) : order);

const attachPaymentToOrder = async (order) => {
  const plainOrder = toPlainOrder(order);

  if (!plainOrder?.id) {
    return plainOrder;
  }

  try {
    const data = await getPaymentByOrderId(plainOrder.id);
    return {
      ...plainOrder,
      payment: data?.payment || null,
    };
  } catch (error) {
    console.warn(`Payment lookup failed for order ${plainOrder.id}:`, error.message);
    return {
      ...plainOrder,
      payment: null,
    };
  }
};

const attachPaymentToOrders = async (orders) => {
  return Promise.all(orders.map((order) => attachPaymentToOrder(order)));
};

const validateShipping = (body) => {
  const missing = SHIPPING_FIELDS.filter((field) => !String(body[field] || '').trim());

  if (missing.length > 0) {
    const error = new Error(`Missing shipping fields: ${missing.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
};

const normalizeManualItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('items must contain at least one product for instore orders');
    error.statusCode = 400;
    throw error;
  }

  return items.map((item) => ({
    ...item,
    product_id: toPositiveInt(item.product_id),
    quantity: toPositiveInt(item.quantity, 1),
  }));
};

const buildItemsFromCart = async (cart) => {
  if (!cart?.items?.length) {
    const error = new Error('Cart is empty');
    error.statusCode = 400;
    throw error;
  }

  const orderItems = [];

  for (const item of cart.items) {
    const snapshot = await getProductSnapshot(item.product_id, {
      variantId: item.variant_id,
      variantKey: item.variant_key,
    });
    const quantity = toPositiveInt(item.quantity);

    if (!quantity || snapshot.stock_quantity < quantity) {
      const error = new Error(`Product ${snapshot.name} does not have enough stock`);
      error.statusCode = 400;
      throw error;
    }

    const productPrice = snapshot.price;
    const productName = String(snapshot.variant_name || snapshot.name).trim();
    const productImage = snapshot.image;

    orderItems.push({
      product_id: snapshot.id,
      variant_id: snapshot.variant_id,
      variant_key: snapshot.variant_key,
      variant_name: snapshot.variant_name,
      product_name: productName || snapshot.name,
      product_price: productPrice,
      product_image: productImage,
      quantity,
      subtotal: productPrice * quantity,
    });
  }

  return orderItems;
};

const buildItemsFromManualInput = async (items) => {
  const normalizedItems = normalizeManualItems(items);
  const orderItems = [];

  for (const item of normalizedItems) {
    if (!item.product_id) {
      const error = new Error('Each item must include a positive product_id');
      error.statusCode = 400;
      throw error;
    }

    const snapshot = await getProductSnapshot(item.product_id, {
      variantId: item.variant_id ?? item.variantId,
      variantKey: item.variant_key ?? item.variantKey,
    });

    if (snapshot.stock_quantity < item.quantity) {
      const error = new Error(`Product ${snapshot.name} does not have enough stock`);
      error.statusCode = 400;
      throw error;
    }

    const productPrice = snapshot.price;
    const productName = String(snapshot.variant_name || snapshot.name).trim();
    const productImage = snapshot.image;

    orderItems.push({
      product_id: snapshot.id,
      variant_id: snapshot.variant_id,
      variant_key: snapshot.variant_key,
      variant_name: snapshot.variant_name,
      product_name: productName || snapshot.name,
      product_price: productPrice,
      product_image: productImage,
      quantity: item.quantity,
      subtotal: productPrice * item.quantity,
    });
  }

  return orderItems;
};

const createStatusHistory = async (orderId, status, note, transaction) => {
  return OrderStatusHistory.create(
    {
      order_id: orderId,
      status,
      note: note || null,
    },
    { transaction }
  );
};

const markOrderStatus = async (order, status, note, transaction) => {
  await order.update({ status }, { transaction });
  await createStatusHistory(order.id, status, note, transaction);
};

const canTransitionOrderStatus = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) {
    return true;
  }

  return (ORDER_STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);
};

const isInternalRefundCancellation = (req, order, nextStatus) => {
  return (
    req.isInternal === true &&
    nextStatus === 'cancelled' &&
    req.body.reason_source === 'refund' &&
    order.status !== 'cancelled'
  );
};

const statusConflict = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

const createOrderRecord = async ({ body, userId, purchaseChannel, status, orderItems }) => {
  const transaction = await sequelize.transaction();

  try {
    const shippingFee = purchaseChannel === 'instore' ? 0 : toMoney(body.shipping_fee, 0);
    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const totalAmount = subtotal + shippingFee;
    const customerName = body.customer_name || body.shipping_name || null;
    const customerPhone = body.customer_phone || body.shipping_phone || null;

    const order = await Order.create(
      {
        order_number: generateOrderNumber(),
        user_id: userId,
        purchase_channel: purchaseChannel,
        status,
        subtotal,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        shipping_name: purchaseChannel === 'instore' ? customerName : body.shipping_name,
        shipping_phone: purchaseChannel === 'instore' ? customerPhone : body.shipping_phone,
        shipping_address: purchaseChannel === 'instore' ? null : body.shipping_address,
        shipping_ward: purchaseChannel === 'instore' ? null : body.shipping_ward,
        shipping_district: purchaseChannel === 'instore' ? null : body.shipping_district,
        shipping_city: purchaseChannel === 'instore' ? null : body.shipping_city,
        note: body.note || null,
      },
      { transaction }
    );

    await OrderItem.bulkCreate(
      orderItems.map((item) => ({
        ...item,
        order_id: order.id,
      })),
      { transaction }
    );

    await createStatusHistory(order.id, status, body.status_note || 'Order created', transaction);
    await transaction.commit();

    return order;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cancelOrderAfterFailure = async (order, reason) => {
  const transaction = await sequelize.transaction();

  try {
    const current = await Order.findByPk(order.id, { transaction, lock: transaction.LOCK.UPDATE });

    if (current && current.status !== 'cancelled') {
      await markOrderStatus(current, 'cancelled', reason, transaction);
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deductStockWithCompensation = async (items) => {
  const deducted = [];

  try {
    for (const item of items) {
      await decrementStock(item.product_id, item.quantity, item);
      deducted.push(item);
    }
  } catch (error) {
    for (const item of deducted.reverse()) {
      try {
        await incrementStock(item.product_id, item.quantity, item);
      } catch (compensationError) {
        console.error('Stock compensation failed:', compensationError);
      }
    }

    throw error;
  }
};

const activateWarrantiesForOrder = async (orderId, transaction = null) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
      {
        model: Warranty,
        as: 'warranties',
      },
    ],
    transaction,
  });

  if (!order || order.status !== 'delivered') {
    return [];
  }

  const expectedCount = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);

  if (order.warranties.length >= expectedCount) {
    return order.warranties;
  }

  const customerName = order.shipping_name;
  const customerPhone = order.shipping_phone;

  if (!customerName || !customerPhone) {
    const error = new Error('Customer name and phone are required to activate warranties');
    error.statusCode = 400;
    throw error;
  }

  const existingCount = order.warranties.length;
  const startDate = new Date();
  const durationMonths = Number(process.env.DEFAULT_WARRANTY_MONTHS || 12);
  const warranties = [];
  let sequence = existingCount + 1;

  for (const item of order.items) {
    for (let index = 0; index < Number(item.quantity); index += 1) {
      if (warranties.length + existingCount >= expectedCount) {
        break;
      }

      warranties.push({
        warranty_code: generateWarrantyCode(order.id, item.id, sequence),
        order_id: order.id,
        order_number: order.order_number,
        product_id: item.product_id,
        product_name: item.product_name,
        serial_number: null,
        customer_name: customerName,
        customer_phone: customerPhone,
        duration_months: durationMonths,
        start_date: startDate,
        end_date: addMonths(startDate, durationMonths),
        status: 'active',
      });
      sequence += 1;
    }
  }

  if (warranties.length === 0) {
    return order.warranties;
  }

  const created = await Warranty.bulkCreate(warranties, { transaction });
  return [...order.warranties, ...created];
};

const ensureCanAccessOrder = (req, order) => {
  if (req.auth?.role === 'admin') {
    return true;
  }

  return order.user_id && Number(order.user_id) === Number(req.auth?.id);
};

const isWithinCustomerCancelWindow = (order) => {
  const createdAt = new Date(order.created_at);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const elapsedMs = Date.now() - createdAt.getTime();
  return elapsedMs <= CUSTOMER_CANCEL_WINDOW_MINUTES * 60 * 1000;
};

const statusNotification = (order, status) => {
  const orderNumber = order.order_number;
  const messages = {
    confirmed: {
      title: 'Đơn hàng đã được xác nhận',
      message: 'Đơn hàng đã được xác nhận và đang được xử lý.',
    },
    processing: {
      title: 'Đơn hàng đang được xử lý',
      message: `Đơn hàng ${orderNumber} đang được xử lý.`,
    },
    shipping: {
      title: 'Đơn hàng đang được giao',
      message: `Đơn hàng ${orderNumber} đang trên đường giao đến bạn.`,
    },
    delivered: {
      title: 'Đơn hàng đã giao thành công',
      message: `Đơn hàng ${orderNumber} đã được giao thành công.`,
    },
    cancelled: {
      title: 'Đơn hàng đã bị hủy',
      message: `Đơn hàng ${orderNumber} đã bị hủy.`,
    },
  };

  return messages[status] || null;
};

const notifyOrderStatusChanged = async (order, status) => {
  const content = statusNotification(order, status);

  if (!content) {
    return;
  }

  await notifyUser({
    userId: order.user_id,
    title: content.title,
    message: content.message,
    type: 'order_status',
    entityType: 'order',
    entityId: order.id,
    dedupeKey: `order-status:${order.id}:${status}`,
    data: {
      order_id: order.id,
      order_number: order.order_number,
      status,
    },
  });
};

const notifyNewOrderForAdmin = async (order, paymentMethod) => {
  await notifyAdmin({
    title: 'Có đơn hàng mới',
    message: `Đơn hàng ${order.order_number} vừa được tạo.`,
    type: 'new_order',
    entityType: 'order',
    entityId: order.id,
    dedupeKey: `new-order:${order.id}`,
    data: {
      order_id: order.id,
      order_number: order.order_number,
      payment_method: paymentMethod,
      total_amount: Number(order.total_amount || 0),
    },
  });
};

const ensureOnlinePaymentCompletedBeforeFulfillment = async (order, nextStatus) => {
  if (order.purchase_channel !== 'online' || ['pending', 'cancelled'].includes(nextStatus)) {
    return;
  }

  const data = await getPaymentByOrderId(order.id);
  const payment = data?.payment;

  if (!payment) {
    throw statusConflict('Online payment record is required before updating order status');
  }

  if (PREPAID_ONLINE_PAYMENT_METHODS.includes(payment.payment_method) && payment.status !== 'completed') {
    throw statusConflict('Online payment must be completed before updating order status');
  }
};

export const checkout = async (req, res, next) => {
  try {
    const purchaseChannel = req.body.purchase_channel || 'online';

    if (!['online', 'instore'].includes(purchaseChannel)) {
      return res.status(400).json({ message: 'purchase_channel must be online or instore' });
    }

    if (purchaseChannel === 'instore' && req.auth.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create instore orders' });
    }

    const paymentMethod =
      req.body.payment_method || (purchaseChannel === 'instore' ? 'cash' : 'cod');
    const allowedPaymentMethods =
      purchaseChannel === 'instore' ? INSTORE_PAYMENT_METHODS : ONLINE_PAYMENT_METHODS;

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: `payment_method must be one of: ${allowedPaymentMethods.join(', ')}`,
      });
    }

    let userId = Number(req.auth.id);
    let orderItems;
    let cart = null;
    const usesDirectItems = Array.isArray(req.body.items) && req.body.items.length > 0;

    if (purchaseChannel === 'online') {
      validateShipping(req.body);

      if (usesDirectItems) {
        orderItems = await buildItemsFromManualInput(req.body.items);
      } else {
        cart = await getCartForUser(userId);
        orderItems = await buildItemsFromCart(cart);
      }
    } else {
      userId = req.body.user_id ? toPositiveInt(req.body.user_id) : null;
      const customerName = req.body.customer_name || req.body.shipping_name;
      const customerPhone = req.body.customer_phone || req.body.shipping_phone;

      if (!customerName || !customerPhone) {
        return res.status(400).json({
          message: 'customer_name and customer_phone are required for instore warranty activation',
        });
      }

      orderItems = await buildItemsFromManualInput(req.body.items);
    }

    const initialStatus =
      purchaseChannel === 'instore' && req.body.mark_paid !== false ? 'delivered' : 'pending';
    const order = await createOrderRecord({
      body: req.body,
      userId,
      purchaseChannel,
      status: initialStatus,
      orderItems,
    });

    try {
      await deductStockWithCompensation(orderItems);
    } catch (error) {
      await cancelOrderAfterFailure(order, `Stock deduction failed: ${error.message}`);
      throw error;
    }

    if (purchaseChannel === 'online' && !usesDirectItems) {
      await clearCartForUser(userId);
    }

    if (initialStatus === 'delivered') {
      await activateWarrantiesForOrder(order.id);
    }

    let payment = null;
    let payment_error = null;

    if (req.body.create_payment !== false) {
      try {
        payment = await createPayment({
          order_id: order.id,
          user_id: userId,
          amount: Number(order.total_amount),
          payment_method: paymentMethod,
          purchase_channel: purchaseChannel,
          order_number: order.order_number,
        });
      } catch (error) {
        payment_error = error.message;
      }
    }

    const freshOrder = await attachPaymentToOrder(await findOrderByIdOrNumber(order.id));
    await notifyNewOrderForAdmin(freshOrder, paymentMethod);

    return res.status(201).json({
      order: freshOrder,
      payment,
      payment_error,
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;
    const where = {};

    if (req.auth.role !== 'admin') {
      where.user_id = req.auth.id;
    } else {
      if (req.query.user_id) {
        where.user_id = toPositiveInt(req.query.user_id);
      }

      if (req.query.purchase_channel) {
        where.purchase_channel = req.query.purchase_channel;
      }
    }

    if (req.query.status && ORDER_STATUSES.includes(req.query.status)) {
      where.status = req.query.status;
    }

    if (req.query.search) {
      const keyword = `%${String(req.query.search).trim()}%`;
      where[Op.or] = [
        { order_number: { [Op.like]: keyword } },
        { shipping_name: { [Op.like]: keyword } },
        { shipping_phone: { [Op.like]: keyword } },
      ];
    }

    const { rows, count } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      distinct: true,
      include: getOrderIncludes({ includeHistory: false, includeWarranties: false }),
      order: [['created_at', 'DESC']],
    });

    const orders = await attachPaymentToOrders(rows);

    return res.json({
      orders,
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

export const getOrderById = async (req, res, next) => {
  try {
    const order = await findOrderByIdOrNumber(req.params.idOrNumber);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!ensureCanAccessOrder(req, order)) {
      return res.status(403).json({ message: 'You cannot access this order' });
    }

    return res.json({ order: await attachPaymentToOrder(order) });
  } catch (error) {
    return next(error);
  }
};

export const retryOrderPayment = async (req, res, next) => {
  try {
    const order = await findOrderByIdOrNumber(req.params.id, {
      include: getOrderIncludes({ includeHistory: false, includeWarranties: false }),
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!ensureCanAccessOrder(req, order)) {
      return res.status(403).json({ message: 'You cannot access this order' });
    }

    if (order.purchase_channel !== 'online') {
      return res.status(409).json({ message: 'Only online orders can use online payment retry' });
    }

    if (order.status !== 'pending') {
      return res.status(409).json({ message: 'Only pending unpaid orders can be paid or changed' });
    }

    const existing = await getPaymentByOrderId(order.id);
    const existingPayment = existing?.payment || null;
    const paymentMethod = req.body.payment_method || existingPayment?.payment_method || 'vnpay';

    if (!ONLINE_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        message: `payment_method must be one of: ${ONLINE_PAYMENT_METHODS.join(', ')}`,
      });
    }

    if (existingPayment?.status === 'completed') {
      return res.status(409).json({ message: 'This order has already been paid' });
    }

    const paymentPayload = {
      order_id: order.id,
      user_id: order.user_id,
      amount: Number(order.total_amount),
      payment_method: paymentMethod,
      purchase_channel: order.purchase_channel,
      order_number: order.order_number,
      bank_code: req.body.bank_code,
      locale: req.body.locale,
    };
    const payment = existingPayment
      ? await retryPayment(order.id, paymentPayload)
      : await createPayment(paymentPayload);
    const freshOrder = await attachPaymentToOrder(await findOrderByIdOrNumber(order.id));

    return res.json({
      order: freshOrder,
      payment: payment?.payment || null,
      payment_url: payment?.payment_url || null,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  let transaction = await sequelize.transaction();

  try {
    const { status, note } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ message: `status must be one of: ${ORDER_STATUSES.join(', ')}` });
    }

    const order = await Order.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    const allowRefundCancellation = isInternalRefundCancellation(req, order, status);

    if (!canTransitionOrderStatus(order.status, status) && !allowRefundCancellation) {
      await transaction.rollback();
      throw statusConflict(`Cannot change order status from ${order.status} to ${status}`);
    }

    await ensureOnlinePaymentCompletedBeforeFulfillment(order, status);

    const previousStatus = order.status;
    await markOrderStatus(order, status, note || `Status changed to ${status}`, transaction);

    if (status === 'delivered') {
      await activateWarrantiesForOrder(order.id, transaction);
    }

    await transaction.commit();
    transaction = null;

    if (status === 'delivered') {
      try {
        await completeCodPaymentForDelivery(order.id, {
          note: note || 'COD collected when order was delivered',
        });
      } catch (error) {
        if (error.statusCode !== 404) {
          console.warn(`COD payment completion failed for order ${order.id}:`, error.message);
        }
      }
    }

    if (previousStatus !== status) {
      await notifyOrderStatusChanged(order, status);
    }

    const freshOrder = await findOrderByIdOrNumber(order.id);
    return res.json({ order: await attachPaymentToOrder(freshOrder) });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  let transaction = null;

  try {
    const order = await findOrderByIdOrNumber(req.params.id, {
      include: getOrderIncludes({ includeHistory: false, includeWarranties: false }),
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.user_id || Number(order.user_id) !== Number(req.auth.id)) {
      return res.status(403).json({ message: 'You cannot cancel this order' });
    }

    if (order.status !== 'pending') {
      return res.status(409).json({ message: 'Only pending orders can be cancelled by customers' });
    }

    if (!isWithinCustomerCancelWindow(order)) {
      return res.status(409).json({
        message: `Orders can only be cancelled within ${CUSTOMER_CANCEL_WINDOW_MINUTES} minutes after checkout`,
      });
    }

    for (const item of order.items || []) {
      await incrementStock(item.product_id, Number(item.quantity), item);
    }

    transaction = await sequelize.transaction();
    const current = await Order.findByPk(order.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!current) {
      await transaction.rollback();
      transaction = null;
      return res.status(404).json({ message: 'Order not found' });
    }

    if (current.status !== 'pending') {
      await transaction.rollback();
      transaction = null;
      return res.status(409).json({ message: 'Order status changed and can no longer be cancelled' });
    }

    await markOrderStatus(
      current,
      'cancelled',
      req.body.note || 'Customer cancelled pending order within allowed window',
      transaction
    );
    await transaction.commit();
    transaction = null;

    const freshOrder = await findOrderByIdOrNumber(order.id);
    return res.json({ order: await attachPaymentToOrder(freshOrder) });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const lookupWarranties = async (req, res, next) => {
  try {
    const query = String(req.query.query || req.query.q || '').trim();

    if (!query) {
      return res.status(400).json({ message: 'query is required' });
    }

    const warranties = await Warranty.findAll({
      where: {
        [Op.or]: [
          { warranty_code: { [Op.like]: `%${query}%` } },
          { order_number: { [Op.like]: `%${query}%` } },
          { serial_number: { [Op.like]: `%${query}%` } },
          { customer_phone: { [Op.like]: `%${query}%` } },
        ],
      },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    return res.json({ warranties });
  } catch (error) {
    return next(error);
  }
};

export const getWarranties = async (req, res, next) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;
    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.search) {
      const keyword = `%${String(req.query.search).trim()}%`;
      where[Op.or] = [
        { warranty_code: { [Op.like]: keyword } },
        { order_number: { [Op.like]: keyword } },
        { product_name: { [Op.like]: keyword } },
        { serial_number: { [Op.like]: keyword } },
        { customer_name: { [Op.like]: keyword } },
        { customer_phone: { [Op.like]: keyword } },
      ];
    }

    const { rows, count } = await Warranty.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      warranties: rows,
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

export const getWarrantyById = async (req, res, next) => {
  try {
    const warranty = await Warranty.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'user_id', 'purchase_channel', 'status', 'created_at'],
        },
      ],
    });

    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    if (req.auth.role !== 'admin' && Number(warranty.order?.user_id) !== Number(req.auth.id)) {
      return res.status(403).json({ message: 'You cannot access this warranty' });
    }

    return res.json({ warranty });
  } catch (error) {
    return next(error);
  }
};

export const createWarranty = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.body.order_id);

    if (!order) {
      return res.status(400).json({ message: 'order_id must reference an existing order' });
    }

    const durationMonths = toPositiveInt(req.body.duration_months, Number(process.env.DEFAULT_WARRANTY_MONTHS || 12));
    const startDate = req.body.start_date ? new Date(req.body.start_date) : new Date();
    const warranty = await Warranty.create({
      warranty_code: req.body.warranty_code || generateWarrantyCode(order.id, req.body.product_id || 0, Date.now()),
      order_id: order.id,
      order_number: order.order_number,
      product_id: toPositiveInt(req.body.product_id),
      product_name: req.body.product_name,
      serial_number: req.body.serial_number || null,
      customer_name: req.body.customer_name || order.shipping_name,
      customer_phone: req.body.customer_phone || order.shipping_phone,
      duration_months: durationMonths,
      start_date: startDate,
      end_date: req.body.end_date ? new Date(req.body.end_date) : addMonths(startDate, durationMonths),
      status: req.body.status || 'active',
    });

    return res.status(201).json({ warranty });
  } catch (error) {
    return next(error);
  }
};

export const updateWarranty = async (req, res, next) => {
  try {
    const warranty = await Warranty.findByPk(req.params.id);

    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    const payload = pick(req.body, [
      'serial_number',
      'customer_name',
      'customer_phone',
      'duration_months',
      'start_date',
      'end_date',
      'status',
    ]);

    if (payload.status && !['active', 'expired', 'claimed', 'voided'].includes(payload.status)) {
      return res.status(400).json({ message: 'Invalid warranty status' });
    }

    await warranty.update(payload);

    return res.json({ warranty });
  } catch (error) {
    return next(error);
  }
};
