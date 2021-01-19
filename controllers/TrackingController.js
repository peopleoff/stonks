const { tracking } = require("../models");

module.exports = {
  getTracking() {
    return new Promise((resolve, reject) => {
      tracking
        .findAll()
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  addTracking(trackingObject) {
    return new Promise((resolve, reject) => {
      tracking
        .create(trackingObject)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  removeTracking(id) {
    tracking.destroy({
      where: {
        id: id,
      },
    });
  },
};
