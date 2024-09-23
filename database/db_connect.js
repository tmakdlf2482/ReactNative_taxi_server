// MariaDB와 접속하는 DB의 브릿지 역할
const db = require('mysql');

const conn = db.createConnection({
  host: 'localhost', // 현재 개발 중인 localhost를 DB 서버로 사용
  port: 3307,
  user: 'taxi', // taxi 서버에는 taxi 유저만 접속
  password: 'taxi',
  database: 'taxi', // DB이름
});

module.exports = conn; // conn을 밖에서 사용 가능하도록 만듬