import sequelize from '../config/database.js';
import BlogPost from './blogPost.js';

export { sequelize, BlogPost };

export default {
  sequelize,
  BlogPost,
};
