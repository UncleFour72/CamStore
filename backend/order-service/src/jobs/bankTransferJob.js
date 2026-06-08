import { Op } from 'sequelize';
import { expireBankTransferPayment, getPaymentByOrderId } from '../clients/paymentClient.js';
import { incrementStock } from '../clients/productClient.js';
import { notifyAdmin, notifyUser } from '../clients/notificationClient.js';
import { Order, OrderItem, OrderStatusHistory, sequelize } from '../models/index.js';

const reminderHours = Number(process.env.BANK_TRANSFER_REMINDER_HOURS || 24);
const expiryHours = Number(process.env.BANK_TRANSFER_EXPIRY_HOURS || 48);
const intervalMs = Number(process.env.BANK_TRANSFER_JOB_INTERVAL_MS || 5 * 60 * 1000);

const getCutoff = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);

const isPendingBankTransfer = (payment) => {
  return payment?.payment_method === 'bank_transfer' && payment?.status === 'pending';
};

const notifyPaymentReminder = async (order) => {
  await notifyUser({
    userId: order.user_id,
    title: 'Nhắc thanh toán chuyển khoản',
    message: `Đơn hàng ${order.order_number} sẽ tự động hủy nếu chưa được thanh toán sau ${expiryHours} giờ.`,
    type: 'payment_reminder',
    entityType: 'order',
    entityId: order.id,
    dedupeKey: `bank-transfer-reminder:${order.id}`,
    data: {
      order_id: order.id,
      order_number: order.order_number,
      expiry_hours: expiryHours,
    },
  });
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
        note: `Auto cancelled after ${expiryHours} hours without bank transfer payment`,
      },
      { transaction }
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  for (const item of order.items || []) {
    try {
      await incrementStock(item.product_id, Number(item.quantity), item);
    } catch (error) {
      console.warn(`Stock restore failed for product ${item.product_id}:`, error.message);
    }
  }

  try {
    await expireBankTransferPayment(order.id, {
      reason: `bank_transfer_expired_${expiryHours}h`,
    });
  } catch (error) {
    console.warn(`Payment expiry failed for order ${order.id}:`, error.message);
  }

  await notifyUser({
    userId: order.user_id,
    title: 'Đơn hàng đã tự động hủy',
    message: `Đơn hàng ${order.order_number} đã bị hủy vì chưa thanh toán chuyển khoản trong ${expiryHours} giờ.`,
    type: 'order_cancelled',
    entityType: 'order',
    entityId: order.id,
    dedupeKey: `bank-transfer-expired-user:${order.id}`,
    data: {
      order_id: order.id,
      order_number: order.order_number,
      reason: 'bank_transfer_expired',
    },
  });

  await notifyAdmin({
    title: 'Đơn chuyển khoản đã tự động hủy',
    message: `Đơn hàng ${order.order_number} đã tự động hủy vì quá hạn thanh toán.`,
    type: 'order_cancelled',
    entityType: 'order',
    entityId: order.id,
    dedupeKey: `bank-transfer-expired-admin:${order.id}`,
    data: {
      order_id: order.id,
      order_number: order.order_number,
      reason: 'bank_transfer_expired',
    },
  });

  return true;
};

const scanPendingBankTransfers = async () => {
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
    limit: Number(process.env.BANK_TRANSFER_JOB_BATCH_SIZE || 50),
  });

  for (const order of orders) {
    try {
      const data = await getPaymentByOrderId(order.id);
      const payment = data?.payment;

      if (!isPendingBankTransfer(payment)) {
        continue;
      }

      if (new Date(order.created_at) <= expiryCutoff) {
        await cancelExpiredOrder(order);
      } else {
        await notifyPaymentReminder(order);
      }
    } catch (error) {
      console.warn(`Bank transfer scan failed for order ${order.id}:`, error.message);
    }
  }
};

export const startBankTransferPaymentJob = () => {
  if (process.env.BANK_TRANSFER_JOB_ENABLED === 'false') {
    return;
  }

  setTimeout(() => {
    scanPendingBankTransfers().catch((error) => {
      console.warn('Initial bank transfer scan failed:', error.message);
    });
  }, Number(process.env.BANK_TRANSFER_JOB_START_DELAY_MS || 15000));

  setInterval(() => {
    scanPendingBankTransfers().catch((error) => {
      console.warn('Bank transfer scan failed:', error.message);
    });
  }, intervalMs);
};
