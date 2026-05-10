const mysql = require('mysql2');
const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

promisePool.query('SELECT 1')
    .then(() => {
        console.log('Database connected');
    })
    .catch((err) => {
        console.error('Connection failed:', err.message);
    });

module.exports = promisePool;