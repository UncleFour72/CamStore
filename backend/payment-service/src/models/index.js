import sequelize from '../config/database.js';
import Payment from './payment.js';

export { sequelize, Payment };

export default {
  sequelize,
  Payment,
};
