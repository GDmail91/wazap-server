/********************
 * ALRAMS PAGE
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
    };

    // TODO 알림 목록 가져오는 프로세스

    var dummy_data = {
        result : true,
        msg : "알림목록 가져옴",
        data : [{
            alarm_id : 25,
            msg : "신청자가 있습니다.",
            msg_url : "/contests/15/applies",
            is_check : false
        }, {
            alarm_id : 26,
            msg : "신청자가 있습니다.",
            msg_url : "/contests/15/applies",
            is_check : false
        }, {
            alarm_id : 27,
            msg : "신청자가 있습니다.",
            msg_url : "/contests/15/applies",
            is_check : false
        }, {
            alarm_id : 28,
            msg : "신청자가 있습니다.",
            msg_url : "/contests/15/applies",
            is_check : true
        }, {
            alarm_id : 29,
            msg : "신청자가 있습니다.",
            msg_url : "/contests/15/applies",
            is_check : true
        }, {
            alarm_id : 30,
            msg : "신청자가 있습니다.",
            msg_url : "/contests/15/applies",
            is_check : true
        }, {
            alarm_id : 31,
            msg : "신청자가 있습니다.",
            msg_url : "/contests/15/applies",
            is_check : true
        }]
    };
    res.header(200);
    res.send(dummy_data);
});

module.exports = router;
