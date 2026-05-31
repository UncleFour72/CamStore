import sequelize from '../config/database.js';
import Payment from './payment.js';
import Refund from './refund.js';

Payment.hasMany(Refund, {
  as: 'refunds',
  foreignKey: 'payment_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Refund.belongsTo(Payment, {
  as: 'payment',
  foreignKey: 'payment_id',
});

export { sequelize, Payment, Refund };

export default {
  sequelize,
  Payment,
  Refund,
};
