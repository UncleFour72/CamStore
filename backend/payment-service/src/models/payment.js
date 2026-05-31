import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Payment extends Model {
  appendCallbackData(data) {
    const existing = this.callback_data ? JSON.parse(this.callback_data) : [];
    const history = Array.isArray(existing) ? existing : [existing];
    history.push({
      at: new Date().toISOString(),
      data,
    });

    this.callback_data = JSON.stringify(history);
  }
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    transaction_id: {
      type: DataTypes.STRING(120),
      allowNull: true,
      unique: true,
    },
    payment_method: {
      type: DataTypes.ENUM('cod', 'vnpay', 'momo', 'cash', 'bank_transfer', 'pos_card'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    amount: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    payment_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    callback_data: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    indexes: [
      { fields: ['order_id'], unique: true },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['payment_method'] },
    ],
  }
);

export default Payment;
