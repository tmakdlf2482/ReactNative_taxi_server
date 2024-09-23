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
    if (!err) { // query에 에러가 없으면
      console.log('login / rows = ' + JSON.stringify(rows));

      let len = Object.keys(rows).length; // 가지고 온 데이터가 얼마나 되는지 체크
      console.log('login / len = ' + len);

      let code = (len==0) ? 1 : 0; // 0은 정상 실행, 즉 데이터가 하나도 없으면 1출력//하나라도 있으면 0출력
      let message = (len==0) ? '아이디 또는 비밀번호가 잘못 입력되었습니다.' : '로그인 성공';
      
      res.json([{code: code, message: message}]);
    }
    else { // query에 에러가 있으면
      console.log('login / err = ' + err);

      res.json([{code: 1, message: err}]);
    }
  });
});

router.post('/taxi/register', function(req, res) {
  console.log('register / req.body = ' + JSON.stringify(req.body));

  let userId = req.body.userId;
  let userPw = req.body.userPw;

  console.log('register / userId = ' + userId + ', userPw = ' + userPw);

  if (!(userId && userPw)) {
    res.json([{code: 1, message: '아이디 또는 비밀번호가 없습니다.'}]);
    
    return;
  }

  let queryStr = `INSERT INTO tb_user VALUES ("${userId}", "${userPw}", "")`;
  console.log('register / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('register / rows = ' + JSON.stringify(rows));

      res.json([{code: 0, message: '회원가입이 완료되었습니다.'}]);
    }
    else { // query에 에러가 있으면
      console.log('register / err = ' + err);

      if (err.code == 'ER_DUP_ENTRY') { // DB안에 PK(user_id)값을 중복으로 넣으려고 할 때 에러 발생
        res.json([{code: 2, message: '이미 등록된 아이디입니다.'}]);
      }
      else { // 알 수 없는 에러
        res.json([{code: 3, message: '알 수 없는 오류가 발생했습니다.', data: err}]);
      }
    }
  });
});

module.exports = router;