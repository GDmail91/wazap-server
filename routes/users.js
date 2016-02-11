/********************
 * USERS PAGE
 ********************/

var express = require('express');
var credentials = require('../credentials');
var mysql = require('mysql');
var pool = mysql.createPool({
    host    : credentials.mysql.host,
    port : credentials.mysql.port,
    user : credentials.mysql.user,
    password : credentials.mysql.password,
    database: credentials.mysql.database,
    connectionLimit: 20,
    waitForConnections: false
});

var router = express.Router();
/*
router.get('/', function(req, res, next) {

});*/

/* POST users registration */
router.post('/reg', function(req, res, next) {
    var data = {
        'access_token': req.body.access_token,
        'kakao_id': req.body.kakao_id,
        'username': req.body.username,
        'school': req.body.school,
        'age': req.body.age,
        'major': req.body.major,
        'locate': req.body.locate,
        'introduce': req.body.introduce,
        'exp': req.body.exp
    };
    if(data.access_token) {
        // TODO user 정보 수정
        pool.getConnection(function (err, connection) {
            var insert = [data.kakao_id, data.username, data.school, data.age, data.major, data.locate, data.introduce, data.exp, data.access_token];
            var query = connection.query('UPDATE users SET ' +
                    'kakao_id = ??, ' +
                    'username = ??, ' +
                    'school = ??, ' +
                    'age = ??, ' +
                    'major = ??, ' +
                    'locate = ??, ' +
                    'introduce = ??, ' +
                    'exp = ?? WHERE kakao_access_token = ?', insert, function (err, rows) {
                if (err) {
                    connection.release();
                    return res.send({ result: false, msg: "정보 수정에 실패했습니다. 원인: "+err });
                }
                connection.release();

                var dummy_data = {
                    result : true,
                    msg : "정보 수정에 성공했습니다."
                };
                res.statusCode(200);
                return res.send(dummy_data);
            });
        });
    }
    res.send({ result: false, msg: "정보 수정에 실패했습니다. 원인: 토큰 데이터가 없습니다" });
    /*
    else {
        // user 생성
        pool.getConnection(function (err, connection) {
            var insert = [data.kakao_id, data.username, data.school, data.age, data.major, data.locate, data.introduce, data.exp];
            var query = connection.query("INSERT INTO Users (kakao_id, username, school, age, major, locate, introduce, exp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", insert, function (err, rows) {
                if (err) {
                    connection.release();
                    return res.send({ result: false, msg: "회원가입에 실패했습니다. "+err });
                }
                connection.release();

                var dummy_data = {
                    result : true,
                    msg : "회원가입에 성공했습니다."
                };
                res.statusCode(200);
                res.send(dummy_data);
            });
        });
    }
    */
});

/* POST users authenticate process */
router.post('/auth', function(req, res, next) {
    var data = {
        'access_token': req.body.access_token
    };

    // login 정보 확인
    pool.getConnection(function (err, connection) {
        var select = [data.access_token];
        var query = connection.query("SELECT * FROM Users WHERE kakao_access_token = ?", select, function (err, rows) {
            if (err) {
                connection.release();
                return res.send({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: "+err });
            }
            connection.release();

            if (rows.length != 0) {
                var dummy_data = {
                    result: true,
                    msg: "인증에 성공했습니다."
                };
            } else {
                var dummy_data = {
                    result: false,
                    msg: "인증에 실패했습니다."
                };
            }
            res.statusCode = 200;
            res.send(dummy_data);
        });
    });
/*
    // 실서버 사용시
    // Session 정보 세팅
    req.session.is_login = true;
    req.session.userinfo = {
        is_login : true,
        user_id : 10,
        username : "Young Soo"
    };
    //console.log(req.session);

    var dummy_data = {
        result : true,
        msg : "로그인에 성공했습니다.",
        data : {
            is_login : true,
                user_id : 10,
                username : "Young Soo"
        }
    };
    res.statusCode(200);
    res.send(dummy_data);
*/
});

/* DELETE login information. */
router.delete('/login', function(req, res, next) {
    // TODO 로그아웃 처리
    var dummy_data = {
        result : true,
        msg : "로그아웃 되었습니다."
    };
    res.statusCode(200);
    res.send(dummy_data);
});

/* GET user information */
router.get('/:user_id', function(req, res, next) {
    var data = {
        'user_id': req.params.user_id
    };

    // 사용자 정보 가져옴
    pool.getConnection(function (err, connection) {
        var select = [data.user_id];

        var query = connection.query("SELECT username, major, school, locate, kakao_id, introduce, exp, age FROM Users WHERE users_id = ?", select, function (err, rows) {
            if (err) {
                connection.release();
                return res.send({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: "+err });
            }
            connection.release();

            if (rows.length != 0) {
                var dummy_data = {
                    result: true,
                    msg: "사용자 정보 가져옴",
                    data: rows
                };
            } else {
                var dummy_data = {
                    result: false,
                    msg: "사용자 정보가 없습니다."
                };
            }
            res.statusCode = 200;
            res.send(dummy_data);
        });
    });
});

module.exports = router;
