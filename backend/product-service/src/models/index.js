import sequelize from '../config/database.js';
import Category from './category.js';
import Product from './product.js';
import ProductImage from './productImage.js';
import ProductSpec from './productSpec.js';
import Wishlist from './wishlist.js';

Category.hasMany(Category, {
  as: 'children',
  foreignKey: 'parent_id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

Category.belongsTo(Category, {
  as: 'parent',
  foreignKey: 'parent_id',
});

Category.hasMany(Product, {
  as: 'products',
  foreignKey: 'category_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Product.belongsTo(Category, {
  as: 'category',
  foreignKey: 'category_id',
});

Product.hasMany(ProductImage, {
  as: 'images',
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

ProductImage.belongsTo(Product, {
  as: 'product',
  foreignKey: 'product_id',
});

Product.hasMany(ProductSpec, {
  as: 'specs',
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

ProductSpec.belongsTo(Product, {
  as: 'product',
  foreignKey: 'product_id',
});

Product.hasMany(Wishlist, {
  as: 'wishlists',
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Wishlist.belongsTo(Product, {
  as: 'product',
  foreignKey: 'product_id',
});

export { sequelize, Category, Product, ProductImage, ProductSpec, Wishlist };

export default {
  sequelize,
  Category,
  Product,
  ProductImage,
  ProductSpec,
  Wishlist,
};
