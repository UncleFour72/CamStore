import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Notification extends Model {}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    recipient_type: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'system',
    },
    entity_type: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    dedupe_key: {
      type: DataTypes.STRING(180),
      allowNull: true,
      unique: true,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    indexes: [
      { fields: ['recipient_type', 'recipient_id'] },
      { fields: ['read_at'] },
      { fields: ['type'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['dedupe_key'], unique: true },
    ],
  }
);

export default Notification;
