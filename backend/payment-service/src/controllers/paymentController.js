import { cancelOrderForRefund, updateOrderStatus } from '../clients/orderClient.js';
import { notifyUser } from '../clients/notificationClient.js';
import { Payment, Refund, sequelize } from '../models/index.js';
import { createMomoPaymentRequest, isMomoSuccess, verifyMomoCallback } from '../utils/momo.js';
import { createVnpayPaymentUrl, isVnpaySuccess, verifyVnpayCallback } from '../utils/vnpay.js';

const PAYMENT_METHODS = ['cod', 'vnpay', 'momo', 'cash', 'bank_transfer', 'pos_card'];
const DIRECT_COMPLETED_METHODS = ['cash', 'pos_card'];
const ONLINE_GATEWAY_METHODS = ['vnpay', 'momo'];
const EXPIRABLE_UNPAID_METHODS = ['cod', 'vnpay', 'momo', 'bank_transfer'];

const isPlaceholder = (value) => !value || String(value).startsWith('your_');

const shouldUseMockGateway = (method) => {
  const mode = String(process.env.PAYMENT_GATEWAY_MODE || 'auto').toLowerCase();

  if (mode === 'mock') {
    return true;
  }

  if (mode === 'real') {
    return false;
  }

  if (method === 'vnpay') {
    return isPlaceholder(process.env.VNPAY_TMN_CODE) || isPlaceholder(process.env.VNPAY_HASH_SECRET);
  }

  if (method === 'momo') {
    return (
      isPlaceholder(process.env.MOMO_PARTNER_CODE) ||
      isPlaceholder(process.env.MOMO_ACCESS_KEY) ||
      isPlaceholder(process.env.MOMO_SECRET_KEY)
    );
  }

  return false;
};

const getFrontendUrl = () => {
  const firstCorsOrigin = String(process.env.CORS_ORIGIN || '').split(',')[0]?.trim();
  return process.env.FRONTEND_URL || firstCorsOrigin || 'http://localhost:5173';
};

const createMockPaymentUrl = (payment) => {
  const url = new URL('/payment/mock-checkout', getFrontendUrl());
  url.searchParams.set('payment_id', String(payment.id));
  url.searchParams.set('method', payment.payment_method);
  url.searchParams.set('amount', String(payment.amount));
  url.searchParams.set('order_id', String(payment.order_id));

  return url.toString();
};

const toPositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toMoney = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
};

const isDirectCompletedPayment = (method, purchaseChannel) => {
  return DIRECT_COMPLETED_METHODS.includes(method) || (method === 'bank_transfer' && purchaseChannel === 'instore');
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];

  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }

  return req.socket?.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';
};

const serializePayment = (payment) => payment;

const REFUND_FINAL_STATUSES = ['completed', 'rejected'];

const findPaymentForCallback = async (paymentId) => {
  const id = toPositiveInt(paymentId);

  if (!id) {
    return null;
  }

  return Payment.findByPk(id);
};

const applyPaymentSuccess = async ({ payment, transactionId, callbackData, provider }) => {
  if (payment.status === 'completed') {
    return payment;
  }

  payment.appendCallbackData({
    provider,
    status: 'success',
    payload: callbackData,
  });
  await payment.update({
    status: 'completed',
    transaction_id: transactionId || payment.transaction_id,
    paid_at: new Date(),
    callback_data: payment.callback_data,
  });

  try {
    await updateOrderStatus(
      payment.order_id,
      'confirmed',
      `${provider} payment completed: ${transactionId || payment.id}`
    );
  } catch (error) {
    payment.appendCallbackData({
      provider,
      status: 'failed',
      reason: `order_status_rejected: ${error.message}`,
      payload: callbackData,
    });
    await payment.update({
      callback_data: payment.callback_data,
    });

    return payment;
  }

  return payment;
};

const applyPaymentFailure = async ({ payment, callbackData, provider, reason }) => {
  payment.appendCallbackData({
    provider,
    status: 'failed',
    reason,
    payload: callbackData,
  });

  await payment.update({
    status: 'failed',
    callback_data: payment.callback_data,
  });

  return payment;
};

const createMomoUrl = async ({ payment, orderNumber }) => {
  const { endpoint, body } = createMomoPaymentRequest({
    paymentId: payment.id,
    amount: Number(payment.amount),
    orderInfo: `Thanh toan don hang ${orderNumber || payment.order_id}`,
    extraData: {
      order_id: payment.order_id,
      payment_id: payment.id,
    },
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  payment.appendCallbackData({
    provider: 'momo',
    status: 'create_url',
    payload: data,
  });

  if (!response.ok || Number(data.resultCode) !== 0) {
    await payment.update({
      status: 'failed',
      callback_data: payment.callback_data,
    });

    const error = new Error(data.message || 'MoMo payment URL creation failed');
    error.statusCode = 502;
    throw error;
  }

  await payment.update({
    payment_url: data.payUrl || data.deeplink || data.qrCodeUrl || null,
    callback_data: payment.callback_data,
  });

  return data;
};

const createGatewayPaymentUrl = async ({ payment, method, amount, orderNumber, req }) => {
  if (ONLINE_GATEWAY_METHODS.includes(method) && shouldUseMockGateway(method)) {
    await payment.update({
      payment_url: createMockPaymentUrl(payment),
    });

    return payment.payment_url;
  }

  if (method === 'vnpay') {
    const paymentUrl = createVnpayPaymentUrl({
      paymentId: payment.id,
      amount,
      orderInfo: `Thanh toan don hang ${orderNumber || payment.order_id}`,
      ipAddress: getClientIp(req),
      bankCode: req.body.bank_code,
      locale: req.body.locale || 'vn',
    });

    await payment.update({ payment_url: paymentUrl });
    return paymentUrl;
  }

  if (method === 'momo') {
    const data = await createMomoUrl({ payment, orderNumber });
    return data.payUrl || data.deeplink || data.qrCodeUrl || null;
  }

  return null;
};

export const createPaymentRecord = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const orderId = toPositiveInt(req.body.order_id);
    const amount = toMoney(req.body.amount);
    const method = req.body.payment_method;

    if (!orderId || amount === null || !PAYMENT_METHODS.includes(method)) {
      await transaction.rollback();
      return res.status(400).json({
        message: `order_id, valid amount and payment_method (${PAYMENT_METHODS.join(', ')}) are required`,
      });
    }

    const [payment, created] = await Payment.findOrCreate({
      where: { order_id: orderId },
      defaults: {
        order_id: orderId,
        user_id: req.body.user_id || null,
        payment_method: method,
        status: ONLINE_GATEWAY_METHODS.includes(method) ? 'processing' : 'pending',
        amount,
      },
      transaction,
    });

    if (!created) {
      await transaction.rollback();
      return res.status(409).json({ message: 'Payment for this order already exists', payment });
    }

    await transaction.commit();

    if (isDirectCompletedPayment(method, req.body.purchase_channel)) {
      payment.appendCallbackData({
        provider: method,
        status: 'manual_completed',
        payload: req.body.reference || null,
      });
      await payment.update({
        status: 'completed',
        transaction_id: req.body.transaction_id || `${method}-${payment.id}-${Date.now()}`,
        paid_at: new Date(),
        callback_data: payment.callback_data,
      });
      await updateOrderStatus(orderId, 'delivered', `${method} payment completed at POS`);
    } else if (method === 'cod') {
      await updateOrderStatus(orderId, 'confirmed', 'COD order confirmed');
    } else if (ONLINE_GATEWAY_METHODS.includes(method)) {
      await createGatewayPaymentUrl({
        payment,
        method,
        amount,
        orderNumber: req.body.order_number,
        req,
      });
    }

    const freshPayment = await Payment.findByPk(payment.id, {
      include: [{ model: Refund, as: 'refunds' }],
    });

    return res.status(201).json({
      payment: serializePayment(freshPayment),
      payment_url: freshPayment.payment_url,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    return next(error);
  }
};

export const retryPaymentRecord = async (req, res, next) => {
  try {
    const orderId = toPositiveInt(req.params.orderId);
    const method = req.body.payment_method;
    const retryableMethods = ['cod', 'bank_transfer', ...ONLINE_GATEWAY_METHODS];

    if (!orderId || !retryableMethods.includes(method)) {
      return res.status(400).json({
        message: `order_id and payment_method (${retryableMethods.join(', ')}) are required`,
      });
    }

    const payment = await Payment.findOne({ where: { order_id: orderId } });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (['completed', 'refunded'].includes(payment.status)) {
      return res.status(409).json({ message: 'Payment is already completed or refunded' });
    }

    if (method === 'cod') {
      payment.appendCallbackData({
        provider: 'cod',
        status: 'method_changed',
        payload: { order_id: orderId },
      });
      await payment.update({
        payment_method: 'cod',
        status: 'pending',
        payment_url: null,
        transaction_id: null,
        paid_at: null,
        callback_data: payment.callback_data,
      });
      await updateOrderStatus(orderId, 'confirmed', 'Customer changed payment method to COD');
    } else if (method === 'bank_transfer') {
      payment.appendCallbackData({
        provider: 'bank_transfer',
        status: payment.payment_method === method ? 'retry_requested' : 'method_changed',
        payload: { order_id: orderId },
      });
      await payment.update({
        payment_method: 'bank_transfer',
        status: 'pending',
        payment_url: null,
        transaction_id: null,
        paid_at: null,
        callback_data: payment.callback_data,
      });
    } else {
      payment.appendCallbackData({
        provider: method,
        status: payment.payment_method === method ? 'retry_requested' : 'method_changed',
        payload: { order_id: orderId },
      });
      await payment.update({
        payment_method: method,
        status: 'processing',
        payment_url: null,
        transaction_id: null,
        paid_at: null,
        callback_data: payment.callback_data,
      });
      await createGatewayPaymentUrl({
        payment,
        method,
        amount: Number(payment.amount),
        orderNumber: req.body.order_number,
        req,
      });
    }

    const freshPayment = await Payment.findByPk(payment.id, {
      include: [{ model: Refund, as: 'refunds' }],
    });

    return res.json({
      payment: serializePayment(freshPayment),
      payment_url: freshPayment.payment_url,
    });
  } catch (error) {
    return next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;
    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.payment_method) {
      where.payment_method = req.query.payment_method;
    }

    if (req.query.user_id) {
      where.user_id = toPositiveInt(req.query.user_id);
    }

    if (req.query.order_id) {
      where.order_id = toPositiveInt(req.query.order_id);
    }

    const { rows, count } = await Payment.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: Refund, as: 'refunds' }],
      order: [['created_at', 'DESC']],
    });

    return res.json({
      payments: rows,
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

export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{ model: Refund, as: 'refunds' }],
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    return res.json({ payment });
  } catch (error) {
    return next(error);
  }
};

export const getPaymentByOrderId = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      where: { order_id: req.params.orderId },
      include: [{ model: Refund, as: 'refunds' }],
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    return res.json({ payment });
  } catch (error) {
    return next(error);
  }
};

export const confirmBankTransferPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{ model: Refund, as: 'refunds' }],
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.payment_method !== 'bank_transfer') {
      return res.status(409).json({ message: 'Only bank transfer payments can be manually confirmed' });
    }

    if (payment.status === 'completed') {
      return res.json({ payment, changed: false });
    }

    if (payment.status === 'refunded') {
      return res.status(409).json({ message: 'Payment is already completed or refunded' });
    }

    const previous = {
      status: payment.status,
      transaction_id: payment.transaction_id,
      paid_at: payment.paid_at,
      payment_url: payment.payment_url,
      callback_data: payment.callback_data,
    };

    payment.appendCallbackData({
      provider: 'bank_transfer',
      status: 'manual_confirmed',
      payload: {
        note: req.body.note || null,
        reference: req.body.reference || null,
        confirmed_by: req.auth?.id || null,
      },
    });

    await payment.update({
      status: 'completed',
      transaction_id: req.body.transaction_id || req.body.reference || `BANK-${payment.id}-${Date.now()}`,
      paid_at: new Date(),
      payment_url: null,
      callback_data: payment.callback_data,
    });

    try {
      await updateOrderStatus(payment.order_id, 'confirmed', 'Bank transfer payment confirmed by admin');
    } catch (error) {
      payment.appendCallbackData({
        provider: 'bank_transfer',
        status: 'manual_confirm_failed',
        reason: error.message,
      });
      await payment.update({
        ...previous,
        callback_data: payment.callback_data,
      });
      throw error;
    }

    const freshPayment = await Payment.findByPk(payment.id, {
      include: [{ model: Refund, as: 'refunds' }],
    });

    return res.json({ payment: freshPayment, changed: true });
  } catch (error) {
    return next(error);
  }
};

export const expireUnpaidPayment = async (req, res, next) => {
  try {
    const orderId = toPositiveInt(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({ message: 'order_id must be a positive integer' });
    }

    const payment = await Payment.findOne({
      where: { order_id: orderId },
      include: [{ model: Refund, as: 'refunds' }],
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (!EXPIRABLE_UNPAID_METHODS.includes(payment.payment_method)) {
      return res.json({ payment, changed: false, reason: 'payment_method_not_expirable' });
    }

    if (['completed', 'refunded'].includes(payment.status)) {
      return res.json({ payment, changed: false, reason: `payment_${payment.status}` });
    }

    if (payment.status === 'failed') {
      return res.json({ payment, changed: false, reason: 'payment_already_failed' });
    }

    payment.appendCallbackData({
      provider: payment.payment_method,
      status: 'expired',
      reason: req.body.reason || null,
    });

    await payment.update({
      status: 'failed',
      payment_url: null,
      callback_data: payment.callback_data,
    });

    const freshPayment = await Payment.findByPk(payment.id, {
      include: [{ model: Refund, as: 'refunds' }],
    });

    return res.json({ payment: freshPayment, changed: true });
  } catch (error) {
    return next(error);
  }
};

export const expireBankTransferPayment = expireUnpaidPayment;

export const completeCodPaymentForDelivery = async (req, res, next) => {
  try {
    const orderId = toPositiveInt(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({ message: 'order_id must be a positive integer' });
    }

    const payment = await Payment.findOne({
      where: { order_id: orderId },
      include: [{ model: Refund, as: 'refunds' }],
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'completed') {
      return res.json({ payment, changed: false });
    }

    if (payment.payment_method !== 'cod') {
      return res.json({
        payment,
        changed: false,
        reason: 'payment_method_not_cod',
      });
    }

    if (payment.status === 'refunded') {
      return res.status(409).json({ message: 'Payment is already completed or refunded' });
    }

    payment.appendCallbackData({
      provider: 'cod',
      status: 'collected_on_delivery',
      payload: {
        order_id: orderId,
        note: req.body.note || null,
      },
    });

    await payment.update({
      status: 'completed',
      transaction_id: payment.transaction_id || `COD-${payment.id}-${Date.now()}`,
      paid_at: payment.paid_at || new Date(),
      payment_url: null,
      callback_data: payment.callback_data,
    });

    const freshPayment = await Payment.findByPk(payment.id, {
      include: [{ model: Refund, as: 'refunds' }],
    });

    return res.json({ payment: freshPayment, changed: true });
  } catch (error) {
    return next(error);
  }
};

export const handleVnpayIpn = async (req, res, next) => {
  try {
    const verification = verifyVnpayCallback(req.query);

    if (!verification.isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const payment = await findPaymentForCallback(verification.params.vnp_TxnRef);

    if (!payment) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    const paidAmount = Math.round(Number(verification.params.vnp_Amount || 0) / 100);

    if (paidAmount !== Number(payment.amount)) {
      return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
    }

    if (payment.status === 'completed') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (isVnpaySuccess(verification.params)) {
      await applyPaymentSuccess({
        payment,
        transactionId: verification.params.vnp_TransactionNo,
        callbackData: req.query,
        provider: 'vnpay',
      });
    } else {
      await applyPaymentFailure({
        payment,
        callbackData: req.query,
        provider: 'vnpay',
        reason: verification.params.vnp_ResponseCode,
      });
    }

    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    return next(error);
  }
};

export const handleVnpayReturn = async (req, res, next) => {
  try {
    const verification = verifyVnpayCallback(req.query);
    const payment = verification.isValid
      ? await findPaymentForCallback(verification.params.vnp_TxnRef)
      : null;
    let resolvedPayment = payment;
    let isSuccess = verification.isValid && Boolean(payment) && isVnpaySuccess(verification.params);

    if (payment && payment.status !== 'completed') {
      const paidAmount = Math.round(Number(verification.params.vnp_Amount || 0) / 100);

      if (paidAmount !== Number(payment.amount)) {
        isSuccess = false;
        await applyPaymentFailure({
          payment,
          callbackData: req.query,
          provider: 'vnpay',
          reason: 'invalid_amount',
        });
      } else if (isVnpaySuccess(verification.params)) {
        resolvedPayment = await applyPaymentSuccess({
          payment,
          transactionId: verification.params.vnp_TransactionNo,
          callbackData: req.query,
          provider: 'vnpay_return',
        });
        isSuccess = resolvedPayment.status === 'completed';
      } else {
        resolvedPayment = await applyPaymentFailure({
          payment,
          callbackData: req.query,
          provider: 'vnpay_return',
          reason: verification.params.vnp_ResponseCode,
        });
      }
    }

    return res.json({
      provider: 'vnpay',
      is_valid: verification.isValid,
      is_success: isSuccess,
      payment: resolvedPayment,
      params: verification.params,
    });
  } catch (error) {
    return next(error);
  }
};

export const handleMomoIpn = async (req, res, next) => {
  try {
    const verification = verifyMomoCallback(req.body);

    if (!verification.isValid) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const payment = await findPaymentForCallback(req.body.orderId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (Number(req.body.amount) !== Number(payment.amount)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (payment.status !== 'completed') {
      if (isMomoSuccess(req.body)) {
        await applyPaymentSuccess({
          payment,
          transactionId: String(req.body.transId || ''),
          callbackData: req.body,
          provider: 'momo',
        });
      } else {
        await applyPaymentFailure({
          payment,
          callbackData: req.body,
          provider: 'momo',
          reason: req.body.message || req.body.resultCode,
        });
      }
    }

    return res.json({ message: 'Received' });
  } catch (error) {
    return next(error);
  }
};

export const handleMomoReturn = async (req, res, next) => {
  try {
    const payload = req.method === 'GET' ? req.query : req.body;
    const verification = verifyMomoCallback(payload);
    const payment = verification.isValid ? await findPaymentForCallback(payload.orderId) : null;
    let resolvedPayment = payment;
    let isSuccess = verification.isValid && Boolean(payment) && isMomoSuccess(payload);

    if (payment && payment.status !== 'completed') {
      if (Number(payload.amount) !== Number(payment.amount)) {
        isSuccess = false;
        await applyPaymentFailure({
          payment,
          callbackData: payload,
          provider: 'momo_return',
          reason: 'invalid_amount',
        });
      } else if (isMomoSuccess(payload)) {
        resolvedPayment = await applyPaymentSuccess({
          payment,
          transactionId: String(payload.transId || ''),
          callbackData: payload,
          provider: 'momo_return',
        });
        isSuccess = resolvedPayment.status === 'completed';
      } else {
        resolvedPayment = await applyPaymentFailure({
          payment,
          callbackData: payload,
          provider: 'momo_return',
          reason: payload.message || payload.resultCode,
        });
      }
    }

    return res.json({
      provider: 'momo',
      is_valid: verification.isValid,
      is_success: isSuccess,
      payment: resolvedPayment,
      params: payload,
    });
  } catch (error) {
    return next(error);
  }
};

export const completeMockPayment = async (req, res, next) => {
  try {
    const payment = await findPaymentForCallback(req.params.id);
    const result = String(req.body.result || req.query.result || 'success').toLowerCase();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (!ONLINE_GATEWAY_METHODS.includes(payment.payment_method) || !shouldUseMockGateway(payment.payment_method)) {
      return res.status(403).json({ message: 'Mock payment is not enabled for this payment method' });
    }

    let resolvedPayment = payment;

    if (result === 'success') {
      resolvedPayment = await applyPaymentSuccess({
        payment,
        transactionId: `MOCK-${payment.payment_method.toUpperCase()}-${payment.id}-${Date.now()}`,
        callbackData: {
          ...req.body,
          ...req.query,
          payment_id: payment.id,
        },
        provider: `mock_${payment.payment_method}`,
      });
    } else {
      resolvedPayment = await applyPaymentFailure({
        payment,
        callbackData: {
          ...req.body,
          ...req.query,
          payment_id: payment.id,
        },
        provider: `mock_${payment.payment_method}`,
        reason: result,
      });
    }

    return res.json({
      provider: `mock_${payment.payment_method}`,
      is_success: resolvedPayment.status === 'completed',
      payment: resolvedPayment,
    });
  } catch (error) {
    return next(error);
  }
};

export const createRefund = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{ model: Refund, as: 'refunds' }],
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(409).json({ message: 'Only completed payments can be refunded' });
    }

    const refundStatus = req.body.status;

    if (!REFUND_FINAL_STATUSES.includes(refundStatus)) {
      return res.status(400).json({ message: 'Refund status must be completed or rejected' });
    }

    const activeRefund = payment.refunds?.find((refund) => ['pending', 'approved', 'completed'].includes(refund.status));

    if (activeRefund) {
      return res.status(409).json({ message: 'This payment already has an active refund request' });
    }

    const amount = toMoney(req.body.amount ?? payment.amount);

    if (amount === null || amount <= 0 || amount > Number(payment.amount)) {
      return res.status(400).json({ message: 'Invalid refund amount' });
    }

    const reason = String(req.body.reason || '').trim();

    if (refundStatus === 'rejected' && !reason) {
      return res.status(400).json({ message: 'Refund rejection reason is required' });
    }

    if (refundStatus === 'completed') {
      await cancelOrderForRefund(payment.order_id, req.body.note || 'Order cancelled before refund completion');
    }

    const refund = await Refund.create({
      payment_id: payment.id,
      amount,
      reason: reason || 'Admin approved refund',
      status: refundStatus,
    });

    if (refundStatus === 'completed') {
      await payment.update({ status: 'refunded' });
      await notifyUser({
        userId: payment.user_id,
        title: 'Đơn hàng đã được hoàn tiền',
        message: `Đơn hàng #${payment.order_id} đã được hủy và hoàn tiền.`,
        type: 'refund_completed',
        entityId: payment.id,
        data: {
          order_id: payment.order_id,
          payment_id: payment.id,
          refund_id: refund.id,
          amount,
        },
        dedupeKey: `refund-completed:${refund.id}`,
      });
    } else {
      await notifyUser({
        userId: payment.user_id,
        title: 'Yêu cầu hoàn tiền bị từ chối',
        message: `Yêu cầu hoàn tiền cho đơn hàng #${payment.order_id} bị từ chối. Lý do: ${reason}`,
        type: 'refund_rejected',
        entityId: payment.id,
        data: {
          order_id: payment.order_id,
          payment_id: payment.id,
          refund_id: refund.id,
          reason,
        },
        dedupeKey: `refund-rejected:${refund.id}`,
      });
    }

    return res.status(201).json({ refund });
  } catch (error) {
    return next(error);
  }
};

export const updateRefundStatus = async (req, res, next) => {
  try {
    const refund = await Refund.findByPk(req.params.refundId, {
      include: [{ model: Payment, as: 'payment' }],
    });

    if (!refund) {
      return res.status(404).json({ message: 'Refund not found' });
    }

    if (!REFUND_FINAL_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: 'Refund status must be completed or rejected' });
    }

    if (refund.payment.status !== 'completed' && req.body.status === 'completed') {
      return res.status(409).json({ message: 'Only completed payments can be refunded' });
    }

    const reason = String(req.body.reason || refund.reason || '').trim();

    if (req.body.status === 'rejected' && !reason) {
      return res.status(400).json({ message: 'Refund rejection reason is required' });
    }

    if (req.body.status === 'completed') {
      await cancelOrderForRefund(refund.payment.order_id, req.body.note || 'Order cancelled before refund completion');
    }

    await refund.update({
      status: req.body.status,
      reason: reason || refund.reason,
    });

    if (req.body.status === 'completed') {
      await refund.payment.update({ status: 'refunded' });
      await notifyUser({
        userId: refund.payment.user_id,
        title: 'Đơn hàng đã được hoàn tiền',
        message: `Đơn hàng #${refund.payment.order_id} đã được hủy và hoàn tiền.`,
        type: 'refund_completed',
        entityId: refund.payment.id,
        data: {
          order_id: refund.payment.order_id,
          payment_id: refund.payment.id,
          refund_id: refund.id,
          amount: Number(refund.amount || 0),
        },
        dedupeKey: `refund-completed:${refund.id}`,
      });
    } else {
      await notifyUser({
        userId: refund.payment.user_id,
        title: 'Yêu cầu hoàn tiền bị từ chối',
        message: `Yêu cầu hoàn tiền cho đơn hàng #${refund.payment.order_id} bị từ chối. Lý do: ${reason}`,
        type: 'refund_rejected',
        entityId: refund.payment.id,
        data: {
          order_id: refund.payment.order_id,
          payment_id: refund.payment.id,
          refund_id: refund.id,
          reason,
        },
        dedupeKey: `refund-rejected:${refund.id}`,
      });
    }

    return res.json({ refund });
  } catch (error) {
    return next(error);
  }
};
