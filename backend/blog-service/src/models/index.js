import sequelize from '../config/database.js';
import BlogPost from './blogPost.js';
import NewsletterSubscriber from './newsletterSubscriber.js';

export { sequelize, BlogPost, NewsletterSubscriber };

export default {
  sequelize,
  BlogPost,
  NewsletterSubscriber,
};
