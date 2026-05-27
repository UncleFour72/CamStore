import sequelize from '../config/database.js';
import Category from './category.js';
import Product from './product.js';

// Relationships
Product.belongsTo(Category, {
  as: 'category',
  foreignKey: 'category_id',
});

Category.hasMany(Product, {
  as: 'products',
  foreignKey: 'category_id',
});

export { sequelize, Product, Category };

export default {
  sequelize,
  Product,
  Category,
};
