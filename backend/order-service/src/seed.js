import { pathToFileURL } from 'url';
import { Order, OrderItem, OrderStatusHistory, sequelize } from './models/index.js';

const productImages = [
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=500&q=80',
];

const orders = [
  {
    order_number: 'ORD-SEED-20260501',
    user_id: 2,
    purchase_channel: 'online',
    status: 'pending',
    shipping_name: 'Demo Customer',
    shipping_phone: '0912345678',
    shipping_address: '123 Nguyen Hue',
    shipping_ward: 'Ben Nghe',
    shipping_district: 'Quan 1',
    shipping_city: 'TP Ho Chi Minh',
    note: 'Khach can goi truoc khi giao.',
    created_at: new Date('2026-05-01T09:10:00+07:00'),
    items: [
      { product_id: 1, product_name: 'Sony Alpha A7 IV Body', product_price: 52990000, quantity: 1 },
    ],
  },
  {
    order_number: 'ORD-SEED-20260502',
    user_id: 3,
    purchase_channel: 'online',
    status: 'confirmed',
    shipping_name: 'Minh Nguyen',
    shipping_phone: '0912000001',
    shipping_address: '45 Le Loi',
    shipping_ward: 'Ben Thanh',
    shipping_district: 'Quan 1',
    shipping_city: 'TP Ho Chi Minh',
    note: 'Thanh toan COD.',
    created_at: new Date('2026-05-02T10:20:00+07:00'),
    items: [
      { product_id: 2, product_name: 'Canon EOS R6 Mark II', product_price: 59500000, quantity: 1 },
    ],
  },
  {
    order_number: 'ORD-SEED-20260503',
    user_id: 4,
    purchase_channel: 'online',
    status: 'processing',
    shipping_name: 'Linh Tran',
    shipping_phone: '0912000002',
    shipping_address: '18 Nguyen Trai',
    shipping_ward: 'Pham Ngu Lao',
    shipping_district: 'Quan 1',
    shipping_city: 'TP Ho Chi Minh',
    note: 'Goi ky truoc khi dong hang.',
    created_at: new Date('2026-05-03T11:30:00+07:00'),
    items: [
      { product_id: 3, product_name: 'Fujifilm X-T5 Kit 18-55mm', product_price: 42990000, quantity: 1 },
      { product_id: 9, product_name: 'Aputure Amaran 200x S', product_price: 8990000, quantity: 1 },
    ],
  },
  {
    order_number: 'ORD-SEED-20260504',
    user_id: 5,
    purchase_channel: 'online',
    status: 'shipping',
    shipping_name: 'Hoang Le',
    shipping_phone: '0912000003',
    shipping_address: '72 Cach Mang Thang 8',
    shipping_ward: 'Vo Thi Sau',
    shipping_district: 'Quan 3',
    shipping_city: 'TP Ho Chi Minh',
    note: 'Giao gio hanh chinh.',
    created_at: new Date('2026-05-04T14:15:00+07:00'),
    items: [
      { product_id: 4, product_name: 'Sony FE 24-70mm F2.8 GM II', product_price: 48990000, quantity: 1 },
    ],
  },
  {
    order_number: 'ORD-SEED-20260505',
    user_id: 6,
    purchase_channel: 'online',
    status: 'delivered',
    shipping_name: 'Anh Pham',
    shipping_phone: '0912000004',
    shipping_address: '9 Phan Xich Long',
    shipping_ward: 'Phuong 2',
    shipping_district: 'Quan Phu Nhuan',
    shipping_city: 'TP Ho Chi Minh',
    note: 'Da giao thanh cong.',
    created_at: new Date('2026-05-05T15:40:00+07:00'),
    items: [
      { product_id: 5, product_name: 'Canon RF 50mm F1.2L USM', product_price: 54990000, quantity: 1 },
    ],
  },
  {
    order_number: 'ORD-SEED-20260506',
    user_id: 7,
    purchase_channel: 'instore',
    status: 'delivered',
    shipping_name: 'Khoa Vo',
    shipping_phone: '0912000005',
    note: 'Mua truc tiep tai quay Quan 1.',
    created_at: new Date('2026-05-06T17:00:00+07:00'),
    items: [
      { product_id: 6, product_name: 'DJI Air 3 Fly More Combo', product_price: 32990000, quantity: 1 },
    ],
  },
  {
    order_number: 'ORD-SEED-20260507',
    user_id: 8,
    purchase_channel: 'online',
    status: 'cancelled',
    shipping_name: 'Thao Bui',
    shipping_phone: '0912000006',
    shipping_address: '21 Dien Bien Phu',
    shipping_ward: 'Phuong 15',
    shipping_district: 'Quan Binh Thanh',
    shipping_city: 'TP Ho Chi Minh',
    note: 'Khach huy trong thoi gian cho phep.',
    created_at: new Date('2026-05-07T08:30:00+07:00'),
    items: [
      { product_id: 7, product_name: 'Peak Design Everyday Backpack 20L', product_price: 6890000, quantity: 1 },
    ],
  },
  {
    order_number: 'ORD-SEED-20260508',
    user_id: 9,
    purchase_channel: 'online',
    status: 'pending',
    shipping_name: 'Nam Dang',
    shipping_phone: '0912000007',
    shipping_address: '12 Xuan Thuy',
    shipping_ward: 'Thao Dien',
    shipping_district: 'TP Thu Duc',
    shipping_city: 'TP Ho Chi Minh',
    note: 'Khach muon nhan cuoi tuan.',
    created_at: new Date('2026-05-08T13:10:00+07:00'),
    items: [
      { product_id: 8, product_name: 'Sony FX30 Cinema Line', product_price: 43990000, quantity: 1 },
    ],
  },
  {
    order_number: 'ORD-SEED-20260509',
    user_id: 10,
    purchase_channel: 'online',
    status: 'confirmed',
    shipping_name: 'Vy Do',
    shipping_phone: '0912000008',
    shipping_address: '88 Tran Duy Hung',
    shipping_ward: 'Trung Hoa',
    shipping_district: 'Cau Giay',
    shipping_city: 'Ha Noi',
    note: 'Dong goi chong soc ky.',
    created_at: new Date('2026-05-09T16:45:00+07:00'),
    items: [
      { product_id: 9, product_name: 'Aputure Amaran 200x S', product_price: 8990000, quantity: 2 },
    ],
  },
  {
    order_number: 'ORD-SEED-20260510',
    user_id: 11,
    purchase_channel: 'instore',
    status: 'processing',
    shipping_name: 'Quang Phan',
    shipping_phone: '0912000009',
    note: 'Khach dat coc tai quay Da Nang.',
    created_at: new Date('2026-05-10T18:20:00+07:00'),
    items: [
      { product_id: 10, product_name: 'Rode Wireless PRO', product_price: 9990000, quantity: 1 },
      { product_id: 7, product_name: 'Peak Design Everyday Backpack 20L', product_price: 6890000, quantity: 1 },
    ],
  },
];

const historyByStatus = {
  pending: ['pending'],
  confirmed: ['pending', 'confirmed'],
  processing: ['pending', 'confirmed', 'processing'],
  shipping: ['pending', 'confirmed', 'processing', 'shipping'],
  delivered: ['pending', 'confirmed', 'processing', 'shipping', 'delivered'],
  cancelled: ['pending', 'cancelled'],
};

const seedOrder = async (payload, index) => {
  const subtotal = payload.items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
  const shipping_fee = payload.purchase_channel === 'online' && payload.status !== 'cancelled' ? 30000 : 0;
  const total_amount = subtotal + shipping_fee;

  const [order] = await Order.findOrCreate({
    where: { order_number: payload.order_number },
    defaults: {
      order_number: payload.order_number,
      user_id: payload.user_id,
      purchase_channel: payload.purchase_channel,
      status: payload.status,
      subtotal,
      shipping_fee,
      total_amount,
      shipping_name: payload.shipping_name,
      shipping_phone: payload.shipping_phone,
      shipping_address: payload.shipping_address || null,
      shipping_ward: payload.shipping_ward || null,
      shipping_district: payload.shipping_district || null,
      shipping_city: payload.shipping_city || null,
      note: payload.note,
      created_at: payload.created_at,
      updated_at: payload.created_at,
    },
  });

  await order.update({
    user_id: payload.user_id,
    purchase_channel: payload.purchase_channel,
    status: payload.status,
    subtotal,
    shipping_fee,
    total_amount,
    shipping_name: payload.shipping_name,
    shipping_phone: payload.shipping_phone,
    shipping_address: payload.shipping_address || null,
    shipping_ward: payload.shipping_ward || null,
    shipping_district: payload.shipping_district || null,
    shipping_city: payload.shipping_city || null,
    note: payload.note,
    created_at: payload.created_at,
    updated_at: payload.created_at,
  });

  await OrderItem.destroy({ where: { order_id: order.id } });
  await OrderStatusHistory.destroy({ where: { order_id: order.id } });

  await OrderItem.bulkCreate(
    payload.items.map((item, itemIndex) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      product_image: productImages[(index + itemIndex) % productImages.length],
      quantity: item.quantity,
      subtotal: item.product_price * item.quantity,
      created_at: payload.created_at,
    }))
  );

  await OrderStatusHistory.bulkCreate(
    historyByStatus[payload.status].map((status, statusIndex) => ({
      order_id: order.id,
      status,
      note: statusIndex === 0 ? 'Seed order created' : `Seed status changed to ${status}`,
      changed_at: new Date(payload.created_at.getTime() + statusIndex * 60 * 60 * 1000),
    }))
  );
};

export const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const [index, order] of orders.entries()) {
    await seedOrder(order, index);
  }

  console.log(`Seeded ${orders.length} orders without warranty records.`);
};

const isMainModule = () =>
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule()) {
  run()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close();
    });
}
