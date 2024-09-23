var express = require('express');
var router = express.Router();

const db = require('../database/db_connect');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// 테스트
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

// 로그인 (유저)
router.post('/taxi/login', function(req, res, next) {
  console.log('login / req.body = ' + JSON.stringify(req.body));

  let userId = req.body.userId;
  let userPw = req.body.userPw;

  let queryStr = `SELECT * FROM tb_user WHERE user_id="${userId}" AND user_pw="${userPw}"`;
  console.log('login / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('login / rows = ' + JSON.stringify(rows));

      let len = Object.keys(rows).length; // 가지고 온 데이터가 얼마나 되는지 체크 (실제로 몇 개의 row가 반환되었는지 체크)
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

// 회원가입 (유저)
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

// 콜 목록 불러오기 (유저)
router.post('/taxi/list', function(req, res) {
  console.log('list / req.body = ' + JSON.stringify(req.body));

  let userId = req.body.userId;
  console.log('list / userId = ' + userId);

  let queryStr = `SELECT * FROM tb_call WHERE user_Id="${userId}" ORDER BY id DESC`; // ORDER BY를 사용하는 이유는 최근 콜 목록을 보기 위해
  console.log('list / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('list / rows = ' + JSON.stringify(rows));

      res.json([{code: 0, message: '택시 호출 목록 불러오기에 성공하였습니다.', data: rows}]);
    }
    else { // query에 에러가 있으면
      console.log('list / err = ' + err);

      res.json([{code: 1, message: '택시 호출 목록 불러오기에 실패하였습니다.', data: err}]);
    }
  });
});

// 새로운 콜 등록 (유저)
router.post('/taxi/call', function(req, res) {
  console.log('call / req.body = ' + JSON.stringify(req.body));

  let userId = req.body.userId; // 누가 콜을 등록했는지
  let startLat = req.body.startLat; // 출발 위도
  let startLng = req.body.startLng; // 출발 경도
  let startAddr = req.body.startAddr; // 출발 주소
  let endLat = req.body.endLat; // 도착 위도
  let endLng = req.body.endLng; // 도착 경도
  let endAddr = req.body.endAddr; // 도착 주소

  if (!(userId && startAddr && startLat && startLng && endAddr && endLat && endLng)) {
    // 7개의 데이터 중 하나라도 빠져 있다면
    res.json([{code: 1, message: '출발지 또는 도착지 정보가 없습니다.'}]);
    return;
  }

  let queryStr = `INSERT INTO tb_call VALUES (NULL, "${userId}", "${startLat}", "${startLng}", "${startAddr}", "${endLat}", "${endLng}", "${endAddr}", "요청", "")`;
  console.log('call / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('call / rows = ' + JSON.stringify(rows));

      res.json([{code: 0, message: '택시 호출이 완료되었습니다.'}]);
    }
    else { // query에 에러가 있으면
      console.log('call / err = ' + err);

      res.json([{code: 2, message: '택시 호출이 실패하였습니다.', data: err}]);
    }
  });
});

// 회원가입 (기사)
router.post('/driver/register', function(req, res) {
  console.log('driver-register / req.body = ' + JSON.stringify(req.body));

  let driverId = req.body.driverId;
  let driverPw = req.body.driverPw;

  console.log('driver-register / driverId = ' + driverId + ', driverPw = ' + driverPw);

  if (!(driverId && driverPw)) {
    res.json([{code: 1, message: '아이디 또는 비밀번호가 없습니다.'}]);

    return;
  }

  let queryStr = `INSERT INTO tb_driver VALUES ("${driverId}", "${driverPw}", "")`;
  console.log('driver-register / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('driver-register / rows = ' + JSON.stringify(rows));

      res.json([{code: 0, message: '회원가입이 완료되었습니다.'}]);
    }
    else { // query에 에러가 있으면
      console.log('driver-register / err = ' + err);

      if (err.code == 'ER_DUP_ENTRY') { // DB안에 PK(user_id)값을 중복으로 넣으려고 할 때 에러 발생
        res.json([{code: 2, message: '이미 등록된 아이디입니다.'}]);
      }
      else { // 알 수 없는 에러
        res.json([{code: 3, message: '알 수 없는 오류가 발생했습니다.', data: err}]);
      }
    }
  });
});

// 로그인 (기사)
router.post('/driver/login', function(req, res) {
  console.log('driver-login / req.body = ' + JSON.stringify(req.body));

  let driverId = req.body.driverId;
  let driverPw = req.body.driverPw;

  let queryStr = `SELECT * FROM tb_driver WHERE driver_id="${driverId}" AND driver_pw="${driverPw}"`;
  console.log('driver-login / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('driver-login / rows = ' + JSON.stringify(rows));

      let len = Object.keys(rows).length; // 가지고 온 데이터가 얼마나 되는지 체크 (실제로 몇 개의 row가 반환되었는지 체크)
      console.log('driver-login / len = ' + len);

      let code = (len==0) ? 1 : 0; // 0은 정상 실행, 즉 데이터가 하나도 없으면 1출력//하나라도 있으면 0출력
      let message = (len==0) ? '아이디 또는 비밀번호가 잘못 입력되었습니다.' : '로그인 성공';
      
      res.json([{code: code, message: message}]);
    }
    else { // query에 에러가 있으면
      console.log('driver-login / err = ' + err);

      res.json([{code: 1, message: err}]);
    }
  });
});

module.exports = router;