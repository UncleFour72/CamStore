import sequelize from '../config/database.js';
import Order from './order.js';
import OrderItem from './orderItem.js';
import OrderStatusHistory from './orderStatusHistory.js';
import Warranty from './warranty.js';

Order.hasMany(OrderItem, {
  as: 'items',
  foreignKey: 'order_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

OrderItem.belongsTo(Order, {
  as: 'order',
  foreignKey: 'order_id',
});

Order.hasMany(OrderStatusHistory, {
  as: 'status_history',
  foreignKey: 'order_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

OrderStatusHistory.belongsTo(Order, {
  as: 'order',
  foreignKey: 'order_id',
});

Order.hasMany(Warranty, {
  as: 'warranties',
  foreignKey: 'order_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Warranty.belongsTo(Order, {
  as: 'order',
  foreignKey: 'order_id',
});

export { sequelize, Order, OrderItem, OrderStatusHistory, Warranty };

export default {
  sequelize,
  Order,
  OrderItem,
  OrderStatusHistory,
  Warranty,
};
