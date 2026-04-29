const sql = require("mssql");

const config = {
  user: "iemsadmin",
  password: "123456",
  server: "KONGZANH",
  database: "KoreanLearning",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

module.exports = { sql, pool, poolConnect };
