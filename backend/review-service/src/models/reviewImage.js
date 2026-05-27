import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ReviewImage extends Model {}

ReviewImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    sequelize,
    modelName: 'ReviewImage',
    tableName: 'review_images',
    updatedAt: false,
    indexes: [{ fields: ['review_id'] }],
  }
);

export default ReviewImage;
