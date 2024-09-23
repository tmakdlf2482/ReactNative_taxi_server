var express = require('express');
var router = express.Router();

const db = require('../database/db_connect');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/taxi/test', function(req, res, next) {
  db.query('SELECT * FROM tb_user', (err, rows, fields) => {
    if (!err) {
      console.log('test / rows = ' + JSON.stringify(rows));

      res.json([{code: 0, data: rows}]); // 정상 실행
    }
    else {
      console.log('test / err = ' + err);

      res.json([{code: 1, data: err}]); // 에러
    }
  });
});

router.post('/taxi/login', function(req, res, next) {
  console.log('login / req.body = ' + JSON.stringify(req.body));

  let userId = req.body.userId;
  let userPw = req.body.userPw;

  let queryStr = `SELECT * FROM tb_user WHERE user_id="${userId}" AND user_pw="${userPw}"`;
  console.log('login / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) {
      console.log('login / rows = ' + JSON.stringify(rows));

      let len = Object.keys(rows).length; // 가지고 온 데이터가 얼마나 되는지 체크
      console.log('login / len = ' + len);

      let code = (len==0) ? 1 : 0; // 0은 정상 실행, 즉 데이터가 하나도 없으면 1출력//하나라도 있으면 0출력
      let message = (len==0) ? '아이디 또는 비밀번호가 잘못 입력되었습니다.' : '로그인 성공';
      
      res.json([{code: code, message: message}]);
    }
    else {
      console.log('login / err = ' + err);

      res.json([{code: 1, message: err}]);
    }
  });
});

module.exports = router;