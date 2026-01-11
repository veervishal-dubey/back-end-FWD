// database.js (Railway-compatible)

const mysql = require("mysql2/promise");

// DO NOT rely on .env in Railway
// Railway injects env vars automatically

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
