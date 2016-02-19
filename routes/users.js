/********************
 * USERS PAGE
 ********************/

var express = require('express');
var users_model = require('../models/users_model');

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

    if(data.access_token != undefined) {
        // user 정보 수정
        users_model.update_info(data, function(result) {
            res.statusCode = 200;
            return res.send(result);
        });
    }
    res.send({ result: false, msg: "정보 수정에 실패했습니다. 원인: 토큰 데이터가 없습니다" });
});

/* POST users authenticate process */
router.post('/auth', function(req, res, next) {
    var data = {
        'access_token': req.body.access_token
    };

    // login 정보 확인
    users_model.auth_user(data, function(result) {
        res.statusCode = 200;
        res.send(result);
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
    res.statusCode = 200;
    res.send(dummy_data);
});

/* GET user information */
router.get('/:user_id', function(req, res, next) {
    var data = {
        'user_id': req.params.user_id
    };

    // 사용자 정보 가져옴
    users_model.get_user(data, function(result) {
        res.statusCode = 200;
        res.send(result);
    });
});

module.exports = router;
