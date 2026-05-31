import { Payment, Refund, sequelize } from './models/index.js';

const payments = [
  {
    order_id: 1,
    user_id: 2,
    transaction_id: null,
    payment_method: 'cod',
    status: 'pending',
    amount: 53020000,
    paid_at: null,
    refunds: [],
  },
  {
    order_id: 2,
    user_id: 3,
    transaction_id: 'VNP-SEED-0002',
    payment_method: 'vnpay',
    status: 'completed',
    amount: 59530000,
    paid_at: new Date('2026-05-02T10:25:00+07:00'),
    refunds: [],
  },
  {
    order_id: 3,
    user_id: 4,
    transaction_id: 'MOMO-SEED-0003',
    payment_method: 'momo',
    status: 'processing',
    amount: 52010000,
    paid_at: null,
    refunds: [],
  },
  {
    order_id: 4,
    user_id: 5,
    transaction_id: 'COD-SEED-0004',
    payment_method: 'cod',
    status: 'completed',
    amount: 49020000,
    paid_at: new Date('2026-05-04T14:25:00+07:00'),
    refunds: [],
  },
  {
    order_id: 5,
    user_id: 6,
    transaction_id: 'BANK-SEED-0005',
    payment_method: 'bank_transfer',
    status: 'completed',
    amount: 55020000,
    paid_at: new Date('2026-05-05T15:45:00+07:00'),
    refunds: [],
  },
  {
    order_id: 6,
    user_id: 7,
    transaction_id: 'CASH-SEED-0006',
    payment_method: 'cash',
    status: 'completed',
    amount: 32990000,
    paid_at: new Date('2026-05-06T17:05:00+07:00'),
    refunds: [],
  },
  {
    order_id: 7,
    user_id: 8,
    transaction_id: 'VNP-SEED-0007',
    payment_method: 'vnpay',
    status: 'refunded',
    amount: 6920000,
    paid_at: new Date('2026-05-07T08:35:00+07:00'),
    refunds: [
      {
        amount: 6920000,
        reason: 'Khach huy don hang trong thoi gian cho phep',
        status: 'completed',
      },
    ],
  },
  {
    order_id: 8,
    user_id: 9,
    transaction_id: null,
    payment_method: 'cod',
    status: 'pending',
    amount: 44020000,
    paid_at: null,
    refunds: [],
  },
  {
    order_id: 9,
    user_id: 10,
    transaction_id: 'POS-SEED-0009',
    payment_method: 'pos_card',
    status: 'completed',
    amount: 18010000,
    paid_at: new Date('2026-05-09T16:50:00+07:00'),
    refunds: [
      {
        amount: 1000000,
        reason: 'Hoan phi ship do giao cham',
        status: 'approved',
      },
    ],
  },
  {
    order_id: 10,
    user_id: 11,
    transaction_id: 'MOMO-SEED-0010',
    payment_method: 'momo',
    status: 'failed',
    amount: 16880000,
    paid_at: null,
    refunds: [],
  },
];

const seedPayment = async (payload, index) => {
  const [payment] = await Payment.findOrCreate({
    where: { order_id: payload.order_id },
    defaults: {
      order_id: payload.order_id,
      user_id: payload.user_id,
      transaction_id: payload.transaction_id,
      payment_method: payload.payment_method,
      status: payload.status,
      amount: payload.amount,
      payment_url: payload.status === 'processing' ? `https://pay.local/camstore/${payload.order_id}` : null,
      callback_data: JSON.stringify([
        {
          at: new Date(2026, 4, index + 1, 9, 0, 0).toISOString(),
          data: { source: 'seed', status: payload.status },
        },
      ]),
      paid_at: payload.paid_at,
    },
  });

  await payment.update({
    user_id: payload.user_id,
    transaction_id: payload.transaction_id,
    payment_method: payload.payment_method,
    status: payload.status,
    amount: payload.amount,
    payment_url: payload.status === 'processing' ? `https://pay.local/camstore/${payload.order_id}` : null,
    callback_data: JSON.stringify([
      {
        at: new Date(2026, 4, index + 1, 9, 0, 0).toISOString(),
        data: { source: 'seed', status: payload.status },
      },
    ]),
    paid_at: payload.paid_at,
  });

  await Refund.destroy({ where: { payment_id: payment.id } });

  if (payload.refunds.length > 0) {
    await Refund.bulkCreate(
      payload.refunds.map((refund) => ({
        payment_id: payment.id,
        ...refund,
      }))
    );
  }
};

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const [index, payment] of payments.entries()) {
    await seedPayment(payment, index);
  }

  console.log(`Seeded ${payments.length} payments.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
