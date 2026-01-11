
// This is the file to connect to and manane the mysql database.

const mysql = require('mysql2/promise');
require('dotenv').config();
// mysql 2 standard library hai to connect to mysql. isse jo bhi private stuff hai, like root passwords and all, source code me bina reveal kiye use kar sakte hai

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});
// agar query run karni hai, to phir hame har baar database se connect karna hoga. Isse accha ki 10 connected objects ek pool rakho, or har query ke time pe uss pool me se nikal lo, or qurey run karne ke baad me pool me return kardo. pool object yahi accomplish kar rha hai.

// the waitForConnections: true mysql ko bolta hai ki agar connections available nahi ho, to wait karo jab tak connection available ho

// connectionLimit: 10 connections se zyada nahi hota.

module.exports = pool;
// make the commonPool object exportable.
