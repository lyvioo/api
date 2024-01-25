const sanitizer = require("perfect-express-sanitizer");

module.exports = sanitizer.clean({
  xss: true,
  noSql: true,
  noSqlLevel: 5
});
