import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProductSpec extends Model {}

ProductSpec.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    spec_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    spec_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'ProductSpec',
    tableName: 'product_specs',
    timestamps: false,
    indexes: [{ fields: ['product_id'] }],
  }
);

export default ProductSpec;
