/********************
 * ALRAMS PAGE
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

/* GET clips list */
router.get('/', function(req, res, next) {
    /*if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.query.access_token,
            'start_id': req.query.start_id,
            'amount': req.query.amount
        };

        if(data.amount == undefined) data.amount = 3;

        // 찜 목록 가져오는 프로세스
        var async = require('async');
        async.waterfall([
            function (callback) {
            }
            ], function(err, result) {
        });
    }*/

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
