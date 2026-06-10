import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PasswordResetToken extends Model {}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'PasswordResetToken',
    tableName: 'password_reset_tokens',
    indexes: [
      { unique: true, fields: ['token_hash'] },
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
      { fields: ['used_at'] },
    ],
  }
);

export default PasswordResetToken;
