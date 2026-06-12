import { pathToFileURL } from 'url';
import { Address, User, sequelize } from './models/index.js';

const adminEmail = (process.env.SEED_ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@camstore.vn').trim().toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@123456';
const resetPassword = process.env.SEED_RESET_ADMIN_PASSWORD === 'true';

const adminPayload = {
  email: adminEmail,
  password: adminPassword,
  first_name: 'CamStore',
  last_name: 'Admin',
  phone: '0900000000',
  avatar_url:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  role: 'admin',
  is_active: true,
};

const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123456';

const customerPayloads = [
  ['customer@camstore.vn', 'Demo', 'Customer', '0912345678', '123 Nguyen Hue', 'Ben Nghe', 'Quan 1', 'TP Ho Chi Minh'],
  ['minh.nguyen@camstore.vn', 'Minh', 'Nguyen', '0912000001', '45 Le Loi', 'Ben Thanh', 'Quan 1', 'TP Ho Chi Minh'],
  ['linh.tran@camstore.vn', 'Linh', 'Tran', '0912000002', '18 Nguyen Trai', 'Pham Ngu Lao', 'Quan 1', 'TP Ho Chi Minh'],
  ['hoang.le@camstore.vn', 'Hoang', 'Le', '0912000003', '72 Cach Mang Thang 8', 'Vo Thi Sau', 'Quan 3', 'TP Ho Chi Minh'],
  ['anh.pham@camstore.vn', 'Anh', 'Pham', '0912000004', '9 Phan Xich Long', 'Phuong 2', 'Quan Phu Nhuan', 'TP Ho Chi Minh'],
  ['khoa.vo@camstore.vn', 'Khoa', 'Vo', '0912000005', '33 Nguyen Van Linh', 'Tan Phong', 'Quan 7', 'TP Ho Chi Minh'],
  ['thao.bui@camstore.vn', 'Thao', 'Bui', '0912000006', '21 Dien Bien Phu', 'Phuong 15', 'Quan Binh Thanh', 'TP Ho Chi Minh'],
  ['nam.dang@camstore.vn', 'Nam', 'Dang', '0912000007', '12 Xuan Thuy', 'Thao Dien', 'TP Thu Duc', 'TP Ho Chi Minh'],
  ['vy.do@camstore.vn', 'Vy', 'Do', '0912000008', '88 Tran Duy Hung', 'Trung Hoa', 'Cau Giay', 'Ha Noi'],
  ['quang.phan@camstore.vn', 'Quang', 'Phan', '0912000009', '16 Bach Dang', 'Hai Chau 1', 'Hai Chau', 'Da Nang'],
].map(([email, first_name, last_name, phone, address_line, ward, district, city]) => ({
  email,
  password: customerPassword,
  first_name,
  last_name,
  phone,
  role: 'customer',
  is_active: true,
  address: {
    full_name: `${first_name} ${last_name}`,
    phone,
    address_line,
    ward,
    district,
    city,
    is_default: true,
  },
}));

const upsertAdmin = async () => {
  const existing = await User.findOne({ where: { email: adminPayload.email } });

  if (!existing) {
    return User.create(adminPayload);
  }

  const nextPayload = {
    first_name: adminPayload.first_name,
    last_name: adminPayload.last_name,
    phone: adminPayload.phone,
    avatar_url: adminPayload.avatar_url,
    role: 'admin',
    is_active: true,
  };

  if (resetPassword) {
    nextPayload.password = adminPassword;
  }

  return existing.update(nextPayload);
};

const upsertCustomer = async (payload) => {
  const userPayload = {
    email: payload.email,
    password: payload.password,
    first_name: payload.first_name,
    last_name: payload.last_name,
    phone: payload.phone,
    role: payload.role,
    is_active: payload.is_active,
  };

  const [customer] = await User.findOrCreate({
    where: { email: payload.email },
    defaults: userPayload,
  });

  await customer.update({
    first_name: payload.first_name,
    last_name: payload.last_name,
    phone: payload.phone,
    role: 'customer',
    is_active: true,
  });

  const [address] = await Address.findOrCreate({
    where: {
      user_id: customer.id,
      address_line: payload.address.address_line,
    },
    defaults: {
      user_id: customer.id,
      ...payload.address,
    },
  });

  await address.update(payload.address);

  return customer;
};

export const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  await upsertAdmin();
  for (const customer of customerPayloads) {
    await upsertCustomer(customer);
  }

  console.log(`Seeded admin account ${adminEmail}.`);
  console.log(`Seeded ${customerPayloads.length} demo customers.`);
};

const isMainModule = () => {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
};

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
