import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class UserIdentity extends Model {}

UserIdentity.init(
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
    provider: {
      type: DataTypes.ENUM('google', 'facebook'),
      allowNull: false,
    },
    provider_user_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    provider_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      set(value) {
        this.setDataValue('provider_email', value ? String(value).trim().toLowerCase() : null);
      },
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'UserIdentity',
    tableName: 'user_identities',
    indexes: [
      { unique: true, fields: ['provider', 'provider_user_id'] },
      { unique: true, fields: ['user_id', 'provider'] },
      { fields: ['provider_email'] },
    ],
  }
);

export default UserIdentity;
