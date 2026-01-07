import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE,
    port : process.env.MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

try {
  const connection = await dbPool.getConnection();
  console.log("✅ MySQL 연결 성공!");
  connection.release();
} catch (err) {
  console.error("❌ MySQL 연결 실패:", err.message);
}

export default dbPool;
