import sequelize from '../config/database.js';
import Cart from './cart.js';
import CartItem from './cartItem.js';

Cart.hasMany(CartItem, {
  as: 'items',
  foreignKey: 'cart_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

CartItem.belongsTo(Cart, {
  as: 'cart',
  foreignKey: 'cart_id',
});

export { sequelize, Cart, CartItem };

export default {
  sequelize,
  Cart,
  CartItem,
};
