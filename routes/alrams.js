/********************
 * ALRAMS PAGE
 ********************/

var express = require('express');
var users_model = require('../models/users_model');
var alrams_model = require('../models/alrams_model');

var router = express.Router();

/* GET alarm list */
router.get('/', function(req, res) {
    if (!req.headers['access-token']) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        if(req.query.amount == undefined) req.query.amount = 3;
        var data = {
            'access_token': req.headers['access-token'],
            'start_id': req.query.start_id,
            'amount': parseInt(req.query.amount)
        };

        // 알림 목록 가져오는 프로세스
        var async = require('async');
        async.waterfall([
            function(callback) {
                // 사용자 인증
                users_model.get_user_id(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            },
            function(back_data, callback) {
                // 알림 목록 가져옴
                data.users_id = back_data.users_id;
                alrams_model.get_alram_list(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            }
            ], function(err, result) {
            // 알림 목록 출력
            if (err) return res.send(err);

            var dummy_data = {
                result: true,
                msg: "알림목록 가져옴",
                data: result
            };
            res.statusCode = 200;
            res.send(dummy_data);
        });
    }
});

/* POST read alarm */
router.put('/:alarm_id', function(req, res) {
    if (!req.headers['access-token']) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.headers['access-token'],
            'alarm_id': parseInt(req.params.alarm_id)
        };

        // 알림 목록 가져오는 프로세스
        var async = require('async');
        async.waterfall([
            function(callback) {
                // 사용자 인증
                users_model.get_user_id(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            },
            function(back_data, callback) {
                // 알림 목록 가져옴
                data.users_id = back_data.users_id;
                alrams_model.set_read_alram(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            }
        ], function(err, result) {
            // 알림 목록 출력
            if (err) return res.send(err);

            var dummy_data = {
                result: true,
                msg: "알림 읽음 처리 완료",
                data: result
            };
            res.statusCode = 200;
            res.send(dummy_data);
        });
    }
});

module.exports = router;
