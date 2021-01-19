module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "channels",
    {
      channel_id: {
        type: DataTypes.STRING(250),
        allowNull: false,
        primaryKey: true,
      },
      channel_name: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      channel_owner_id: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      chat_name: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
    },
    {
      tableName: "channels",
      paranoid: true,
    }
  );
};
