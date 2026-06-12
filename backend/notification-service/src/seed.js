import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import { Notification, sequelize } from './models/index.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});
dotenv.config();

export const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  await Notification.findOrCreate({
    where: { dedupe_key: 'seed-admin-welcome' },
    defaults: {
      recipient_type: 'admin',
      recipient_id: null,
      title: 'CamStore đã sẵn sàng',
      message: 'Hệ thống thông báo đã được khởi tạo.',
      type: 'system',
      dedupe_key: 'seed-admin-welcome',
    },
  });

  console.log('Seeded notification-service.');
};

const isMainModule = () =>
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule()) {
  run()
    .catch((error) => {
      console.error('Failed to seed notification-service:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close();
    });
}
