/********************
 * USERS PAGE
 ********************/

var express = require('express');
var router = express.Router();
/*
router.get('/', function(req, res, next) {

});*/

/* POST users registration */
router.post('/reg', function(req, res, next) {
    var data = {
        'user_id': req.session.userinfo.user_id,
        'kakao_id': req.body.kakao_id,
        'username': req.body.username,
        'school': req.body.school,
        'age': req.body.age,
        'magor': req.body.magor,
        'locate': req.body.locate,
        'introduce': req.body.introduce,
        'exp': req.body.exp
    };
    if (data.user_id != null) {
        // TODO user 생성

        var dummy_data = {
            result : true,
            msg : "회원가입에 성공했습니다."
        };
        res.header(200);
        res.send(dummy_data);
    } else {
        // TODO user 정보 수정

        var dummy_data = {
            result : true,
            msg : "회원가입에 성공했습니다."
        };
        res.header(200);
        res.send(dummy_data);
    }
});

/* POST users login process */
router.post('/login', function(req, res, next) {
    console.log('세션!!!');
    console.log(req.sessions);
    var data = {
        'kakao_id': req.body.kakao_id
    };

    // TODO login 정보 확인

    // Session 정보 세팅
    req.session.isLogin = true;
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
    res.header(200);
    res.send(dummy_data);
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
