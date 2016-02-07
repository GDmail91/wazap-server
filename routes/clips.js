/********************
 * CLIPS PAGE
 ********************/

var express = require('express');
var router = express.Router();

/* GET clips list */
router.get('/', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }

    var data = {
        'user_id': req.session.userinfo.user_id,
        'start_id': req.query.start_id,
        'amount': req.query.amount
    }

    // TODO 찜 목록 가져오는 프로세스

    var dummy_data = {
        result : true,
        msg : "찜 목록 가져옴",
        data : [{
            contests_id : 25,
            title : "넥스터즈 공모전",
            recruitment : 5,
            writer : "홍길동",
            hosts : "네이버",
            categories : "개발/디지인",
            period : "2016/07/24",
            cover : "200자 소개글입니다.",
            positions : "개발자/디자인/기획자",
            members : 3,
            aplliers : 20,
            clips : 30,
            views : 50
        }, {
            contests_id : 26,
            title : "넥스터즈 공모전",
            recruitment : 5,
            writer : "홍길동",
            hosts : "네이버",
            categories : "개발/디지인",
            period : "2016/07/24",
            cover : "200자 소개글입니다.",
            positions : "개발자/디자인/기획자",
            members : 3,
            aplliers : 20,
            clips : 30,
            views : 50
        }, {
            contests_id : 27,
            title : "넥스터즈 공모전",
            recruitment : 5,
            writer : "홍길동",
            hosts : "네이버",
            categories : "개발/디지인",
            period : "2016/07/24",
            cover : "200자 소개글입니다.",
            positions : "개발자/디자인/기획자",
            members : 3,
            aplliers : 20,
            clips : 30,
            views : 50
        }, {
            contests_id : 28,
            title : "넥스터즈 공모전",
            recruitment : 5,
            writer : "홍길동",
            hosts : "네이버",
            categories : "개발/디지인",
            period : "2016/07/24",
            cover : "200자 소개글입니다.",
            positions : "개발자/디자인/기획자",
            members : 3,
            aplliers : 20,
            clips : 30,
            views : 50
        }, {
            contests_id : 29,
            title : "넥스터즈 공모전",
            recruitment : 5,
            writer : "홍길동",
            hosts : "네이버",
            categories : "개발/디지인",
            period : "2016/07/24",
            cover : "200자 소개글입니다.",
            positions : "개발자/디자인/기획자",
            members : 3,
            aplliers : 20,
            clips : 30,
            views : 50
        }]
    };
    res.header(200);
    res.send(dummy_data);
});

/* POST clip on my page */
router.post('/:contest_id', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }

    var data = {
        'user_id': req.session.userinfo.user_id,
        'contest_id': req.params.contest_id
    };

    // TODO 찜 등록 프로세스

    var dummy_data = {
        result : true,
        msg : "찜 했습니다."
    };
    res.header(200);
    res.send(dummy_data);
});

/* DELETE pop on my page */
router.delete('/:contest_id', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }

    var data = {
        'user_id': req.session.userinfo.user_id,
        'contest_id': req.params.contest_id
    };

    // TODO 찜 제거 프로세스

    var dummy_data = {
        result : true,
        msg : "찜 목록 삭제."
    };
    res.header(200);
    res.send(dummy_data);
});

module.exports = router;
