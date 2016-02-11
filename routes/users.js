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
    connectionLimit:20,
    waitForConnections:false
});

var router = express.Router();
/*
router.get('/', function(req, res, next) {

});*/

/* POST users registration */
router.post('/reg', function(req, res, next) {
    var data = {
        'kakao_id': req.body.kakao_id,
        'username': req.body.username,
        'school': req.body.school,
        'age': req.body.age,
        'major': req.body.major,
        'locate': req.body.locate,
        'introduce': req.body.introduce,
        'exp': req.body.exp
    };
    if(req.session.is_login) {
        data.user_id = req.session.userinfo.user_id;

        // TODO user 정보 수정

        var dummy_data = {
            result : true,
            msg : "정보 수정에 성공했습니다."
        };
        res.header(200);
        res.send(dummy_data);

    } else {
        // user 생성
        pool.getConnection(function (err, connection) {
            var insert = [data.kakao_id, data.username, data.school, data.age, data.major, data.locate, data.introduce, data.exp];
            var query = connection.query("INSERT INTO users (kakao_id, username, school, age, major, locate, introduce, exp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", insert, function (err, rows) {
                if (err) {
                    connection.release();
                    return res.send({ result: false, msg: "회원가입에 실패했습니다. "+err });
                }
                connection.release();

                var dummy_data = {
                    result : true,
                    msg : "회원가입에 성공했습니다."
                };
                res.header(200);
                res.send(dummy_data);
            });
        });
    }
});

/* POST users login process */
router.post('/login', function(req, res, next) {
    console.log('세션!!!');
    console.log(req.session);
    console.log(req.sessionID);
    var data = {
        'kakao_id': req.body.kakao_id
    };

    // TODO login 정보 확인
    pool.getConnection(function (err, connection) {
        var select = [data.kakao_id];
        var query = connection.query("SELECT * FROM users WHERE kakao_id = ?", select, function (err, rows) {
            if (err) {
                connection.release();
                //return res.send({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. "+err });
            }
            connection.release();

            if (rows) {

                // Session 정보 세팅
                req.session.is_login = true;
                req.session.userinfo = {
                    is_login: true,
                    user_id: rows[0].users_id,
                    username: rows[0].username
                };

                var dummy_data = {
                    result: true,
                    msg: "로그인에 성공했습니다.",
                    data: {
                        is_login: true,
                        user_id: rows[0].users_id,
                        username: rows[0].username
                    }
                };

            } else {
                var dummy_data = {
                    result: true,
                    msg: "로그인에 실패했습니다."
                };
            }
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
    req.session.isLogin = false;
    req.session.userinfo = {};

    var dummy_data = {
        result : true,
        msg : "로그아웃 되었습니다."
    };
    res.header(200);
    res.send(dummy_data);
});

/* GET user information */
router.get('/:user_id', function(req, res, next) {
    var data = {
        'user_id': req.params.user_id
    };
    console.log(req.session.is_login);

    // TODO 사용자 정보 가져옴


    var dummy_data = {
        result : true,
        msg : "사용자 정보 가져옴",
        data : {
            username : "홍길동",
            major : "신문방송/크리에이터",
            school : "중앙대학교",
            locate : "서울",
            kakao_id : "alkjsif876",
            introduce : "200자 소개글입니다.",
            exp : "기타경험 및 수상내역 입니다."
        }
    };
    res.header(200);
    res.send(dummy_data);
});

module.exports = router;
