import sequelize from '../config/database.js';
import User from './user.js';
import Address from './address.js';

User.hasMany(Address, {
  as: 'addresses',
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Address.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_id',
});

export { sequelize, User, Address };

export default {
  sequelize,
  User,
  Address,
};
