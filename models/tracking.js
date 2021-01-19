module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "tracking",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      channel_id: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      stock_ticker: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      target_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
    },
    {
      tableName: "tracking",
      paranoid: true,
    }
  );
};
