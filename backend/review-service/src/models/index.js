import sequelize from '../config/database.js';
import Review from './review.js';
import ReviewImage from './reviewImage.js';

Review.hasMany(ReviewImage, {
  as: 'images',
  foreignKey: 'review_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

ReviewImage.belongsTo(Review, {
  as: 'review',
  foreignKey: 'review_id',
});

export { sequelize, Review, ReviewImage };

export default {
  sequelize,
  Review,
  ReviewImage,
};
