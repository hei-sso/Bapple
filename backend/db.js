import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database : process.env.MYSQLDATABASE,
    port : process.env.MYSQLPORT,
    waitForConnections:true,
    connectionLimit : 10,
    queueLimit: 0,
});

console.log('MySQL Connection Pool이 생성되었습니다.');

(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('MySQL DB에 성공적으로 연결됨');
        conn.release();
    } catch (err) {
        console.error('MySQL 연결에 실패함', err.message);
    }
})();

export default pool;
