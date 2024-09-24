var express = require('express');
var router = express.Router();

const db = require('../database/db_connect');
const admin = require('firebase-admin');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// fcm_token이 들어왔을 때(유저 로그인, 유저 회원가입, 기사 로그인, 기사 회원가입) update하는 함수
const updateFcm = (fcmToken, table, idColName, id) => {
  const queryStr = `UPDATE ${table} SET fcm_token="${fcmToken}" WHERE ${idColName}="${id}"`;  
  console.log('updateFcm / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (err) { // query에 에러가 있으면
      console.log('updateFcm / err = ' + err);
    }
  });
};

// 기사에게 Push를 보내는 함수 (유저가 택시 호출을 하면 모든 기사에게 이 호출을 받을건지 메시지 보냄)
const sendPushToAllDriver = () => {
  let queryStr = 'SELECT fcm_token FROM tb_driver'; // 기사분들중에 혹시나 fcm_token이 없으면 그 사람은 알림을 받을 수 없는 사람임

  console.log('sendPushToAllDriver / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      for (row of rows) {
        console.log('allDriver - fcm_token = ' + row.fcm_token);

        if (row.fcm_token) {
          sendFcm(row.fcm_token, '배차 요청이 있습니다.');
        }
      }
    }
  });
};

// 1명의 유저에게 Push를 보내는 함수 (기사분이 유저가 부른 콜을 수락했을 때 유저에게 콜을 수락했다는 메시지 보냄)
const sendPushToUser = (userId) => {
  let queryStr = `SELECT fcm_token FROM tb_user WHERE user_id="${userId}"`;
  console.log('sendPushToUser / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('sendPushToUser / rows = ' + JSON.stringify(rows));

      if (Object.keys(rows).length > 0 && rows[0].fcm_token) { // 필드가 있고, fcm_token도 있으면
        sendFcm(rows[0].fcm_token, '기사분이 호출을 수락하였습니다.');
      }
      else {
        console.log('Push 전송 실패');
      }
    }
    else { // query에 에러가 있으면
      console.log('sendPushToUser / err = ' + err);
    }
  });
};

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
  let fcmToken = req.body.fcmToken || ''; // fcmToken이 정상적으로 전달되었다면 fcmToken 변수에 넣고, 전달이 안됐다면 빈 문자열을 fcmToken 변수에 넣음

  let queryStr = `SELECT * FROM tb_user WHERE user_id="${userId}" AND user_pw="${userPw}"`;
  console.log('login / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('login / rows = ' + JSON.stringify(rows));

      let len = Object.keys(rows).length; // 가지고 온 데이터가 얼마나 되는지 체크 (실제로 몇 개의 row가 반환되었는지 체크)
      console.log('login / len = ' + len);

      let code = (len==0) ? 1 : 0; // 0은 정상 실행, 즉 데이터가 하나도 없으면 1출력//하나라도 있으면 0출력
      let message = (len==0) ? '아이디 또는 비밀번호가 잘못 입력되었습니다.' : '로그인 성공';
      
      if (code == 0) { // 로그인이 정상적으로 성공하면
        updateFcm(fcmToken, 'tb_user', 'user_id', userId);
      }

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
  let fcmToken = req.body.fcmToken || ''; // fcmToken이 정상적으로 전달되었다면 fcmToken 변수에 넣고, 전달이 안됐다면 빈 문자열을 fcmToken 변수에 넣음

  console.log('register / userId = ' + userId + ', userPw = ' + userPw);

  if (!(userId && userPw)) {
    res.json([{code: 1, message: '아이디 또는 비밀번호가 없습니다.'}]);
    
    return;
  }

  let queryStr = `INSERT INTO tb_user VALUES ("${userId}", "${userPw}", "${fcmToken}")`;
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

      rows = rows.map(row => { // 유저가 콜을 요청한 시간 가져오기
        const requestTime = new Date(row.request_time); // 시간 가져옴

        // 오늘 날짜인지 아닌지 체크
        const today = new Date(); // 지금 현재 시간 가져옴
        const isToday = requestTime.toDateString() === today.toDateString(); // true이면 오늘, false이면 오늘이 아님
        
        // 날짜와 시간을 분리
        const formattedDate = requestTime.toISOString().split('T')[0]; // 날짜만 가져옴, YYYY-MM-DD 형식
        const formattedTime = requestTime.toTimeString().split(' ')[0].slice(0, 5); // 시간만 가져옴, HH:mm 형식

        row.formatted_time = isToday ? formattedTime : formattedDate; // 기존 row에 formatted_time가 추가된 상태로 클라이언트에 전송

        return row;
      });

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

  let queryStr = `INSERT INTO tb_call VALUES (NULL, "${userId}", "${startLat}", "${startLng}", "${startAddr}", "${endLat}", "${endLng}", "${endAddr}", "요청", "", CURRENT_TIMESTAMP)`;
  console.log('call / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('call / rows = ' + JSON.stringify(rows));

      sendPushToAllDriver(); // fcm_token을 가지고 있는 기사분들에게 일제히 유저가 택시 콜을 불렀다고 메시지를 날림

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
  let fcmToken = req.body.fcmToken || ''; // fcmToken이 정상적으로 전달되었다면 fcmToken 변수에 넣고, 전달이 안됐다면 빈 문자열을 fcmToken 변수에 넣음

  console.log('driver-register / driverId = ' + driverId + ', driverPw = ' + driverPw);

  if (!(driverId && driverPw)) {
    res.json([{code: 1, message: '아이디 또는 비밀번호가 없습니다.'}]);

    return;
  }

  let queryStr = `INSERT INTO tb_driver VALUES ("${driverId}", "${driverPw}", "${fcmToken}")`;
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
  let fcmToken = req.body.fcmToken || ''; // fcmToken이 정상적으로 전달되었다면 fcmToken 변수에 넣고, 전달이 안됐다면 빈 문자열을 fcmToken 변수에 넣음

  let queryStr = `SELECT * FROM tb_driver WHERE driver_id="${driverId}" AND driver_pw="${driverPw}"`;
  console.log('driver-login / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('driver-login / rows = ' + JSON.stringify(rows));

      let len = Object.keys(rows).length; // 가지고 온 데이터가 얼마나 되는지 체크 (실제로 몇 개의 row가 반환되었는지 체크)
      console.log('driver-login / len = ' + len);

      let code = (len==0) ? 1 : 0; // 0은 정상 실행, 즉 데이터가 하나도 없으면 1출력//하나라도 있으면 0출력
      let message = (len==0) ? '아이디 또는 비밀번호가 잘못 입력되었습니다.' : '로그인 성공';
      
      if (code == 0) { // 로그인이 정상적으로 성공하면
        updateFcm(fcmToken, 'tb_call', 'driver_id', driverId);
      }

      res.json([{code: code, message: message}]);
    }
    else { // query에 에러가 있으면
      console.log('driver-login / err = ' + err);

      res.json([{code: 1, message: err}]);
    }
  });
});

// 콜 목록 불러오기 (기사)
router.post('/driver/list', function(req, res) {
  console.log('driver-list / req.body = ' + JSON.stringify(req.body));

  let driverId = req.body.driverId; // 다른 드라이버에게 배차가 된 콜을 이 드라이버가 볼 필요가 없음

  console.log('driver-list / driverId = ' + driverId);

  // 1. 기사 본인이 배차가 된 콜일 경우 (driver_id="${driverId}")
  // 2. 아직 배차가 안된 콜인 경우, 최신 콜이 가장 앞에 오도록 (call_state="요청" ORDER BY id DESC)
  let queryStr = `SELECT * FROM tb_call WHERE driver_id="${driverId}" OR call_state="요청" ORDER BY id DESC`;

  console.log('driver-list / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('driver-list / rows = ' + JSON.stringify(rows));

      res.json([{code: 0, message: '택시 호출 목록 불러오기에 성공하였습니다.', data: rows}]);
    }
    else { // query에 에러가 있으면
      console.log('driver-list / err = ' + err);

      res.json([{code: 1, message: '택시 호출 목록 불러오기에 실패하였습니다.', data: err}]);
    }
  });
});

// 배차, 콜 받음 (기사)
router.post('/driver/accept', function(req, res) {
  console.log('driver-accept / req.body = ' + JSON.stringify(req.body));

  let callId = req.body.callId; // DB에서 tb_call 테이블의 id 컬럼
  let driverId = req.body.driverId;
  let userId = req.body.userId;

  console.log('driver-accept / callId = ' + callId + ', driverId = ' + driverId);

  if (!(callId && driverId)) {
    res.json([{code: 1, message: 'callId 또는 driverId가 없습니다.'}]);

    return;
  }

  // 배차가 됐기 때문에 요청 상태에서 응답 상태로 바뀌어야 함
  let queryStr = `UPDATE tb_call SET driver_id="${driverId}", call_state="응답" WHERE id=${callId}`;
  console.log('driver-accept / queryStr = ' + queryStr);

  db.query(queryStr, (err, rows, fields) => {
    if (!err) { // query에 에러가 없으면
      console.log('driver-accept / rows = ' + JSON.stringify(rows));

      if (rows.affectedRows > 0) { // 영향을 받은 줄이 있음. 즉 업데이트가 되었음
        sendPushToUser(userId);
        
        res.json([{code: 0, message: '배차가 완료되었습니다.'}]);
      }
      else { // 모종의 이유로 요청한 callId가 존재 하지 않았다면
        res.json([{code: 2, message: '이미 완료되었거나 존재하지 않는 콜입니다.'}]);
      }
    }
    else { // query에 에러가 있으면
      console.log('driver-accept / err = ' + err);

      res.json([{code: 3, message: '알 수 없는 오류가 발생하였습니다.', data: err}]);
    }
  });
});

// Push 테스트를 위한 함수
router.post('/push/test', function(req, res, next) {
  console.log('push-test / req.body = ' + JSON.stringify(req.body));

  let fcmToken = req.body.fcmToken;
  let message = req.body.message;

  sendFcm(fcmToken, message); // 알림을 보냄

  res.json([{code: 0, message: 'Push 테스트'}]);
});

// Push를 보내는 함수
const sendFcm = (fcmToken, msg) => {
  // fcmToken : 알림을 보낼 때 이 알림을 받을 기기를 구분할 수 있는 코드
  // fcmToken을 받아와 그 기기에 알림을 보낼 수 있음
  const message = {notification: { title: '알림', body: msg }, token: fcmToken};

  // admin에게 직접 메시지를 보내는 로직
  admin.messaging().send(message)
  .then((response) => {
    console.log('-- Push 성공');
  })
  .catch((error) => {
    console.log('-- Push 실패' + error);
  });
};

module.exports = router;