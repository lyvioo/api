const moment = require('moment');

function getCurrentDateTime() {
  const currentDateTime = moment();
  return currentDateTime.format('YYYY/MM/DD HH:mm:ss');
}

module.exports = {
  getCurrentDateTime
};

