import sequelize from '../config/database.js';
import Order from './order.js';
import OrderItem from './orderItem.js';

// Relationships
Order.hasMany(OrderItem, {
  as: 'items',
  foreignKey: 'order_id',
  onDelete: 'CASCADE',
});

OrderItem.belongsTo(Order, {
  as: 'order',
  foreignKey: 'order_id',
});

export { sequelize, Order, OrderItem };

export default {
  sequelize,
  Order,
  OrderItem,
};
