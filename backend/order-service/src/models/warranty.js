import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Warranty extends Model {}

Warranty.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    warranty_code: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    serial_number: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    customer_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    duration_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
      validate: {
        min: 1,
      },
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'claimed', 'voided'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'Warranty',
    tableName: 'warranties',
    indexes: [
      { fields: ['warranty_code'], unique: true },
      { fields: ['order_id'] },
      { fields: ['order_number'] },
      { fields: ['product_id'] },
      { fields: ['customer_phone'] },
      { fields: ['serial_number'] },
      { fields: ['status'] },
    ],
  }
);

export default Warranty;
