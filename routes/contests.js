/********************
 * CONTESTS PAGE
 ********************/

var express = require('express');
var router = express.Router();

/* GET contests list */
router.get('/', function(req, res, next) {
    var data = {
        'start_id': req.query.start_id,
        'amount': req.query.amount
    };

    // TODO 모집공고 목록 가져옴 (메인)

    var dummy_data = {
        result : true,
        msg : "메인 목록 가져옴",
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
            title : "넥스터즈 공모전2",
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
            title : "넥스터즈 공모전3",
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
        },{
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
        }]
    };
    res.header(200);
    res.send(dummy_data);
});

/* POST contest writing */
router.post('/', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'user_id': req.session.userinfo.user_id,
            'title': req.body.title,
            'recruitment': req.body.recruitment,
            'hosts': req.body.hosts,
            'categories': req.body.categories,
            'period': req.body.period,
            'cover': req.body.cover,
            'positions': req.body.positions
        };

        // TODO 글 작성 프로세스


        var dummy_data = {
            result: true,
            msg: "글작성 완료"
        };
        res.header(200);
        res.send(dummy_data);
    }
});

/* GET contests detail view */
router.get('/:contest_id', function(req, res, next) {
    var data = {
        'contest_id': req.params.contest_id
    };

    var dummy_data = {
        result : true,
        msg : "상세 목록 가져옴",
        data : {
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
        }
    };

    res.header(200);
    res.send(dummy_data);
});

/* PUT contest editing */
router.put('/:contest_id', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'user_id': req.session.userinfo.user_id,
        'contests_id': req.params.contest_id,
        'title': req.body.title,
        'recruitment': req.body.recruitment,
        'hosts': req.body.hosts,
        'categories': req.body.categories,
        'period': req.body.period,
        'cover': req.body.cover,
        'positions': req.body.positions
    };

    // TODO 글 수정 프로세스


    var dummy_data = {
        result : true,
        msg : "수정 완료"
    };
    res.header(200);
    res.send(dummy_data);
});

/* DELETE contests deleting */
router.delete('/:contest_id', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'user_id': req.session.userinfo.user_id,
        'contests_id': req.params.contest_id
    };

    // TODO 글 삭제 프로세스


    var dummy_data = {
        result : true,
        msg : "삭제 완료"
    };
    res.header(200);
    res.send(dummy_data);
});

/* GET contests join form page */
router.get('/:contest_id/join', function(req, res, next) {
    // TODO duplicated
});

/* POST contests join process */
router.post('/:contest_id/join', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'user_id': req.session.userinfo.user_id
    };

    // TODO 공모전 신청 프로세스


    var dummy_data = {
        result : true,
        msg : "신청 완료"
    };
    res.header(200);
    res.send(dummy_data);
});

/* GET contest appliers list */
router.get('/:contest_id/applies', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'user_id': req.session.userinfo.user_id
    };

    // TODO 공모전 신청 프로세스


    var dummy_data = {
        result : true,
        msg : "신청자 목록 가져옴",
        data : [{
            user_id : 10,
            postdate : "2016/07/24 15:20",
            is_check : true
        }, {
            user_id : 11,
            postdate : "2016/07/24 15:20",
            is_check : true
        }, {
            user_id : 12,
            postdate : "2016/07/24 15:20",
            is_check : true
        }, {
            user_id : 13,
            postdate : "2016/07/24 15:20",
            is_check : true
        }, {
            user_id : 14,
            postdate : "2016/07/24 15:20",
            is_check : true
        }, {
            user_id : 15,
            postdate : "2016/07/24 15:20",
            is_check : false
        }, {
            user_id : 16,
            postdate : "2016/07/24 15:20",
            is_check : false
        }, {
            user_id : 17,
            postdate : "2016/07/24 15:20",
            is_check : false
        }, {
            user_id : 18,
            postdate : "2016/07/24 15:20",
            is_check : false
        }]
    };
    res.header(200);
    res.send(dummy_data);
});

/* POST member adding */
router.post('/:contest_id/:applies_id', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'user_id': req.session.userinfo.user_id,
        'contest_id': req.params.contest_id,
        'applies_id': req.params.applies_id
    };

    // TODO 멤버 추가 프로세스

    var dummy_data = {
        result : true,
        msg : "멤버 추가 완료"
    };
    res.header(200);
    res.send(dummy_data);
});

/* DELETE cancel apply */
router.delete('/:contest_id/:applies_id', function(req, res, next) {
    if (!req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'user_id': req.session.userinfo.user_id,
        'contest_id': req.params.contest_id,
        'applies_id': req.params.applies_id
    };

    // TODO 신청서 삭제 프로세스

    var dummy_data = {
        result : true,
        msg : "취소 되었습니다."
    };
    res.header(200);
    res.send(dummy_data);

});

/* GET applies list */
router.get('/applications', function(req, res, next) {
    if (req.session.is_login) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'user_id': req.session.userinfo.user_id,
        'start_id': req.query.start_id,
        'amount': req.query.amount
    };

    // TODO 신청자 목록 가져오는 프로세스

    var dummy_data = {
        result : true,
        msg : "신청목록 가져옴",
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
        }, {
            contests_id : 30,
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
    }

});

module.exports = router;
