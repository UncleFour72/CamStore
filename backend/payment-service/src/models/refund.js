import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Refund extends Model {}

Refund.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    modelName: 'Refund',
    tableName: 'refunds',
    indexes: [
      { fields: ['payment_id'] },
      { fields: ['status'] },
    ],
  }
);

export default Refund;
