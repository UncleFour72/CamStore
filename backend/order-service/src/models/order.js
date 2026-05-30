import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    purchase_channel: {
      type: DataTypes.ENUM('online', 'instore'),
      allowNull: false,
      defaultValue: 'online',
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    shipping_fee: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    shipping_name: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    shipping_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    shipping_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    shipping_ward: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shipping_district: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shipping_city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    indexes: [
      { fields: ['order_number'], unique: true },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['purchase_channel'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Order;
