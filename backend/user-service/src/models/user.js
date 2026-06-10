import bcrypt from 'bcryptjs';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const HASH_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

class User extends Model {
  async comparePassword(candidatePassword) {
    if (!this.password) {
      return false;
    }

    return bcrypt.compare(candidatePassword, this.password);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    values.full_name = `${values.first_name} ${values.last_name}`.trim();
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
      set(value) {
        this.setDataValue('email', String(value || '').trim().toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        validPassword(value) {
          if (value === null || value === undefined || value === '') {
            return;
          }

          if (String(value).length < 6 || String(value).length > 255) {
            throw new Error('Password must contain between 6 and 255 characters');
          }
        },
      },
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrlOrEmpty(value) {
          if (!value) return;
          try {
            new URL(value);
          } catch {
            throw new Error('avatar_url must be a valid URL');
          }
        },
      },
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: false,
      defaultValue: 'customer',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['is_active'] },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, HASH_ROUNDS);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, HASH_ROUNDS);
        }
      },
    },
  }
);

export default User;
