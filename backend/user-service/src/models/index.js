import sequelize from '../config/database.js';
import User from './user.js';
import Address from './address.js';
import UserIdentity from './userIdentity.js';

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

User.hasMany(UserIdentity, {
  as: 'identities',
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

UserIdentity.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_id',
});

export { sequelize, User, Address, UserIdentity };

export default {
  sequelize,
  User,
  Address,
  UserIdentity,
};
