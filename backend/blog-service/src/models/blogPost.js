import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlogPost extends Model {}

BlogPost.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    slug: {
      type: DataTypes.STRING(280),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    author_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    read_time: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'BlogPost',
    tableName: 'blog_posts',
    indexes: [
      { fields: ['slug'] },
      { fields: ['category'] },
      { fields: ['author_id'] },
      { fields: ['is_featured'] },
      { fields: ['is_published'] },
      { fields: ['published_at'] },
    ],
  }
);

export default BlogPost;
