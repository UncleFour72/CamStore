import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class NewsletterSubscriber extends Model {}

NewsletterSubscriber.init(
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
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    subscribed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    unsubscribed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'NewsletterSubscriber',
    tableName: 'newsletter_subscribers',
    timestamps: false,
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['is_active'] },
    ],
  }
);

export default NewsletterSubscriber;
