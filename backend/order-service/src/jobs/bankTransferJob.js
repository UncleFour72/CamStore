import { Op } from 'sequelize';
import { expireUnpaidPayment, getPaymentByOrderId } from '../clients/paymentClient.js';
import { incrementStock } from '../clients/productClient.js';
import { notifyAdmin, notifyUser } from '../clients/notificationClient.js';
import { Order, OrderItem, OrderStatusHistory, sequelize } from '../models/index.js';

const PREPAID_ONLINE_PAYMENT_METHODS = ['bank_transfer', 'vnpay', 'momo'];
const UNPAID_PAYMENT_STATUSES = ['pending', 'processing'];

const reminderHours = Number(
  process.env.UNPAID_PAYMENT_REMINDER_HOURS || process.env.BANK_TRANSFER_REMINDER_HOURS || 12
);
const expiryHours = Number(process.env.UNPAID_PAYMENT_EXPIRY_HOURS || process.env.BANK_TRANSFER_EXPIRY_HOURS || 24);
const intervalMs = Number(
  process.env.UNPAID_PAYMENT_JOB_INTERVAL_MS || process.env.BANK_TRANSFER_JOB_INTERVAL_MS || 5 * 60 * 1000
);

const getCutoff = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);

const isPendingPrepaidOnlinePayment = (payment) => {
  return (
    PREPAID_ONLINE_PAYMENT_METHODS.includes(payment?.payment_method) &&
    UNPAID_PAYMENT_STATUSES.includes(payment?.status)
  );
};

const notifyPaymentReminder = async (order) => {
  await notifyUser({
    userId: order.user_id,
    title: 'Nhắc thanh toán đơn hàng',
    message: `Đơn hàng ${order.order_number} sẽ tự động hủy nếu chưa hoàn tất thanh toán sau ${expiryHours} giờ.`,
    type: 'payment_reminder',
    entityType: 'order',
    entityId: order.id,
    dedupeKey: `unpaid-payment-reminder:${order.id}`,
    data: {
      order_id: order.id,
      order_number: order.order_number,
      reminder_hours: reminderHours,
      expiry_hours: expiryHours,
    },
  });
};

const restoreOrderStock = async (order) => {
  for (const item of order.items || []) {
    try {
      await incrementStock(item.product_id, Number(item.quantity), item);
    } catch (error) {
      console.warn(`Stock restore failed for product ${item.product_id}:`, error.message);
    }
  }
};

const cancelExpiredOrder = async (order) => {
  const transaction = await sequelize.transaction();

  try {
    const current = await Order.findByPk(order.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!current || current.status !== 'pending') {
      await transaction.rollback();
      return false;
    }

    await current.update({ status: 'cancelled' }, { transaction });
    await OrderStatusHistory.create(
      {
        order_id: current.id,
        status: 'cancelled',
        note: `Auto cancelled after ${expiryHours} hours without payment`,
      },
      { transaction }
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await restoreOrderStock(order);

  try {
    await expireUnpaidPayment(order.id, {
      reason: `unpaid_payment_expired_${expiryHours}h`,
    });
  } catch (error) {
    console.warn(`Payment expiry failed for order ${order.id}:`, error.message);
  }

  await notifyUser({
    userId: order.user_id,
    title: 'Đơn hàng đã tự động hủy',
    message: `Đơn hàng ${order.order_number} đã bị hủy vì chưa hoàn tất thanh toán trong ${expiryHours} giờ.`,
    type: 'order_cancelled',
    entityType: 'order',
    entityId: order.id,
    dedupeKey: `unpaid-payment-expired-user:${order.id}`,
    data: {
      order_id: order.id,
      order_number: order.order_number,
      reason: 'unpaid_payment_expired',
    },
  });

  await notifyAdmin({
    title: 'Đơn hàng online đã tự động hủy',
    message: `Đơn hàng ${order.order_number} đã tự động hủy vì quá hạn thanh toán.`,
    type: 'order_cancelled',
    entityType: 'order',
    entityId: order.id,
    dedupeKey: `unpaid-payment-expired-admin:${order.id}`,
    data: {
      order_id: order.id,
      order_number: order.order_number,
      reason: 'unpaid_payment_expired',
    },
  });

  return true;
};

const scanPendingUnpaidPayments = async () => {
  const reminderCutoff = getCutoff(reminderHours);
  const expiryCutoff = getCutoff(expiryHours);

  const orders = await Order.findAll({
    where: {
      status: 'pending',
      purchase_channel: 'online',
      created_at: { [Op.lte]: reminderCutoff },
    },
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
    ],
    order: [['created_at', 'ASC']],
    limit: Number(process.env.UNPAID_PAYMENT_JOB_BATCH_SIZE || process.env.BANK_TRANSFER_JOB_BATCH_SIZE || 50),
  });

  for (const order of orders) {
    try {
      const data = await getPaymentByOrderId(order.id);
      const payment = data?.payment;

      if (!isPendingPrepaidOnlinePayment(payment)) {
        continue;
      }

      if (new Date(order.created_at) <= expiryCutoff) {
        await cancelExpiredOrder(order);
      } else {
        await notifyPaymentReminder(order);
      }
    } catch (error) {
      console.warn(`Unpaid payment scan failed for order ${order.id}:`, error.message);
    }
  }
};

export const startBankTransferPaymentJob = () => {
  const enabled = process.env.UNPAID_PAYMENT_JOB_ENABLED ?? process.env.BANK_TRANSFER_JOB_ENABLED ?? 'true';

  if (enabled === 'false') {
    return;
  }

  setTimeout(() => {
    scanPendingUnpaidPayments().catch((error) => {
      console.warn('Initial unpaid payment scan failed:', error.message);
    });
  }, Number(process.env.UNPAID_PAYMENT_JOB_START_DELAY_MS || process.env.BANK_TRANSFER_JOB_START_DELAY_MS || 15000));

  setInterval(() => {
    scanPendingUnpaidPayments().catch((error) => {
      console.warn('Unpaid payment scan failed:', error.message);
    });
  }, intervalMs);
};
