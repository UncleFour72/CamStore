import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class OrderStatusHistory extends Model {}

OrderStatusHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'OrderStatusHistory',
    tableName: 'order_status_history',
    timestamps: false,
    indexes: [{ fields: ['order_id'] }],
  }
);

export default OrderStatusHistory;
