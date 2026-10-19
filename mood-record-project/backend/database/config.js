const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'xinyu_db',
  charset: 'utf8mb4',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const execute = async (sql, params) => {
  const [results, fields] = await pool.execute(sql, params);
  return [results, fields];
};

module.exports = {
  execute,
  getConnection: () => pool.getConnection()
};